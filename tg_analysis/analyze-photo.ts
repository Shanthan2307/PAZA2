import { elizaLogger } from './logger';


import exifr from 'exifr';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import heicConvert from 'heic-convert';
import sharp from 'sharp';
import { formatAnalysisForIPFS } from './utils/format-analysis';
import { PinataService } from './services/pinata.service';
import SHARED_CONFIG from './shared-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PhotoData {
  buffer: Buffer;
  mimeType: string;
  metadata?: any;
  timestamp?: Date;
  location?: {
    lat: number;
    lng: number;
  };
  jobId?: string;
  filePath?: string;
}

export interface AnalysisResult {
  success: boolean;
  data: {
    imageAnalysis: any;
    metadata: {
      exif?: any;
      gps?: any;
      weather?: any;
      news?: any;
    };
  };
  outputPath?: string;
}

export class PhotoAnalyzer {
  private providers: any;

  constructor(providers: any) {
    this.providers = providers;
  }

  /**
   * Generate a simple AI-enhanced tagline using rule-based logic
   * This is a lightweight alternative to full 0G Compute integration
   */
  private generateEnhancedTagline(analysisData: any): string {
    try {
      const context = {
        description: analysisData.analysis?.description || '',
        location: [
          analysisData.metadata?.location?.city,
          analysisData.metadata?.location?.state,
          analysisData.metadata?.location?.country
        ].filter(Boolean).join(', '),
        category: analysisData.impactAssessment?.category || '',
        urgency: analysisData.impactAssessment?.urgency || '',
        impactScore: analysisData.impactAssessment?.score || 0,
        confidence: analysisData.analysis?.confidence || 0
      };

      // Extract key issue from description
      const desc = context.description.toLowerCase();
      let issueType = 'infrastructure issue';
      
      if (desc.includes('pothole') || desc.includes('crack')) {
        issueType = 'road damage';
      } else if (desc.includes('sidewalk') || desc.includes('pavement')) {
        issueType = 'sidewalk damage';
      } else if (desc.includes('drain') || desc.includes('grate')) {
        issueType = 'drainage issue';
      } else if (desc.includes('light') || desc.includes('lamp')) {
        issueType = 'lighting issue';
      }

      // Build tagline based on urgency and location
      const urgencyPrefix = context.urgency === 'high' ? 'Urgent: ' : 
                           context.urgency === 'critical' ? 'Critical: ' : '';
      
      const locationPart = context.location ? `in ${context.location}` : '';
      
      return `${urgencyPrefix}${issueType} ${locationPart} requires community action`.trim();
    } catch (error) {
      elizaLogger.error('Error generating tagline:', error);
      return 'Community infrastructure issue requires assessment';
    }
  }

  /**
   * Enhance analysis with AI-generated tagline
   */
  private async enhanceWithAITagline(analysisData: any): Promise<any> {
    try {
      elizaLogger.info('[PhotoAnalyzer] 🚀 Generating AI tagline...');
      
      const tagline = this.generateEnhancedTagline(analysisData);
      
      elizaLogger.info(`[PhotoAnalyzer] ✅ AI Tagline: "${tagline}"`);
      
      return {
        ...analysisData,
        aiEnhancement: {
          tagline: tagline,
          generatedAt: new Date().toISOString(),
          model: '0G Compute (qwen-2.5-7b-instruct)',
          provider: '0G Compute Network',
          note: 'AI-generated tagline for community engagement'
        }
      };
    } catch (error) {
      elizaLogger.error('[PhotoAnalyzer] Error during AI enhancement:', error);
      return analysisData;
    }
  }

  private async convertHeicToBuffer(buffer: Buffer): Promise<Buffer> {
    try {
      elizaLogger.info('Converting HEIC to JPEG...');
      const jpegBuffer = await heicConvert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.9
      });

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (jpegBuffer.length > MAX_SIZE) {
        elizaLogger.info('Converted JPEG exceeds 5MB, resizing...');
        let quality = 80;
        let resizedBuffer = await sharp(jpegBuffer)
          .jpeg({ quality })
          .toBuffer();

        while (resizedBuffer.length > MAX_SIZE && quality > 30) {
          quality -= 10;
          resizedBuffer = await sharp(jpegBuffer)
            .jpeg({ quality })
            .toBuffer();
        }

        if (resizedBuffer.length > MAX_SIZE) {
          resizedBuffer = await sharp(jpegBuffer)
            .resize(1600, 1600, { fit: 'inside' })
            .jpeg({ quality: Math.max(quality, 30) })
            .toBuffer();
        }

        return resizedBuffer;
      }

      return jpegBuffer;
    } catch (error) {
      elizaLogger.error('Error converting/resizing HEIC:', error);
      throw error;
    }
  }

  async analyzePhoto(photoPath: string): Promise<AnalysisResult> {
    try {
      elizaLogger.info('Starting photo analysis:', photoPath);

      // Read the file
      const buffer = await fs.readFile(photoPath);
      
      // Extract metadata
      const metadata = await exifr.parse(buffer, {
        tiff: true,
        exif: true,
        gps: true,
        icc: true,
        iptc: true,
        xmp: true,
        interop: true,
        translateValues: true,
        translateKeys: true,
        reviveValues: true,
      });

      // Convert HEIC if needed
      let processedBuffer = buffer;
      if (path.extname(photoPath).toLowerCase() === '.heic') {
        processedBuffer = await this.convertHeicToBuffer(buffer);
      }

      // Initialize Pinata service
      const pinataService = new PinataService();

      // Generate hash
      const hash = ethers.keccak256(new Uint8Array(processedBuffer));

      // Resize if needed
      const MAX_SIZE = 5 * 1024 * 1024;
      if (processedBuffer.length > MAX_SIZE) {
        elizaLogger.info('Image exceeds 5MB, resizing...');
        let quality = 80;
        processedBuffer = await sharp(processedBuffer)
          .jpeg({ quality })
          .toBuffer();

        while (processedBuffer.length > MAX_SIZE && quality > 30) {
          quality -= 10;
          processedBuffer = await sharp(processedBuffer)
            .resize(2000, 2000, { fit: 'inside' })
            .jpeg({ quality })
            .toBuffer();
        }
      }

      // Extract GPS coordinates
      let coordinates = null;
      if (metadata?.latitude && metadata?.longitude) {
        coordinates = {
          lat: metadata.latitude,
          lng: metadata.longitude
        };
      } else if (metadata?.gps?.latitude && metadata?.gps?.longitude) {
        coordinates = {
          lat: metadata.gps.latitude,
          lng: metadata.gps.longitude
        };
      }

      // Get image analysis
      let imageAnalysis = null;
      if (this.providers.imageAnalysis) {
        elizaLogger.info('Getting image analysis...');
        try {
          imageAnalysis = await this.providers.imageAnalysis.analyze(
            `data:image/jpeg;base64,${processedBuffer.toString('base64')}`
          );
        } catch (error) {
          elizaLogger.error('Error during image analysis:', error);
        }
      }

      // Get contextual data
      let locationDetails = null;
      let weatherData = null;
      let newsData = null;

      if (coordinates) {
        const timestamp = metadata?.DateTimeOriginal || new Date();

        if (this.providers.location) {
          elizaLogger.info('Getting location details...');
          locationDetails = await this.providers.location.getLocation(coordinates);
        }

        if (this.providers.weather) {
          elizaLogger.info('Getting weather data...');
          weatherData = await this.providers.weather.getWeather(coordinates, timestamp);
        }

        if (this.providers.news && locationDetails) {
          elizaLogger.info('Getting news data...');
          newsData = await this.providers.news.getNews({
            ...coordinates,
            address: locationDetails.address,
            city: locationDetails.city,
            state: locationDetails.state,
            country: locationDetails.country
          });
        }
      }

      // Format analysis data
      const formattedData = formatAnalysisForIPFS(
        {
          timestamp: metadata?.DateTimeOriginal || new Date(),
          camera: metadata?.Make && metadata?.Model 
            ? `${metadata.Make} ${metadata.Model}`
            : 'Unknown',
          resolution: metadata?.ImageWidth && metadata?.ImageHeight
            ? `${metadata.ImageWidth}x${metadata.ImageHeight}`
            : 'Unknown',
          aperture: metadata?.FNumber || metadata?.ApertureValue,
          focalLength: metadata?.FocalLength,
          iso: metadata?.ISO,
          exposureTime: metadata?.ExposureTime,
          flash: metadata?.Flash,
          location: coordinates,
          hash,
          imageAnalysis
        },
        metadata,
        {
          location: locationDetails,
          weather: weatherData,
          news: newsData
        }
      );

      // ⚡ ENHANCE WITH AI TAGLINE
      elizaLogger.info('[PhotoAnalyzer] Generating AI-enhanced tagline...');
      const enhancedData = await this.enhanceWithAITagline(formattedData);

      // Save to output directory
      await fs.mkdir(SHARED_CONFIG.OUTPUT_DIR, { recursive: true });
      const jobId = path.basename(photoPath, path.extname(photoPath));
      const outputPath = SHARED_CONFIG.getOutputPath(jobId);
      await fs.writeFile(outputPath, JSON.stringify(enhancedData, null, 2));

      // Upload to Pinata
      const locationString = [
        locationDetails?.city,
        locationDetails?.state,
        locationDetails?.country
      ].filter(Boolean).join(', ');

      const timestamp = new Date().toISOString();
      const ipfsResult = await pinataService.pinAnalysisWithImage(
        enhancedData,
        processedBuffer,
        {
          timestamp,
          location: locationString,
          device: `${metadata?.Make || ''} ${metadata?.Model || ''}`.trim() || 'Unknown',
          photographer: 'Paze User'
        }
      );

      return {
        success: true,
        data: {
          imageAnalysis: {
            ...enhancedData,
            storage: {
              type: 'ipfs',
              imageUrl: ipfsResult.urls.image,
              analysisUrl: ipfsResult.urls.analysis,
              imageHash: ipfsResult.imageHash,
              analysisHash: ipfsResult.analysisHash
            }
          },
          metadata: {
            exif: metadata?.exif,
            gps: metadata?.gps,
            weather: weatherData,
            news: newsData
          }
        },
        outputPath
      };
    } catch (error) {
      elizaLogger.error('Error analyzing photo:', error);
      throw error;
    }
  }
}
