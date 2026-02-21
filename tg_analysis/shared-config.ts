import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHARED_CONFIG = {
  OUTPUT_DIR: path.join(__dirname, 'output'),
  getOutputPath: (jobId: string) => {
    return path.join(SHARED_CONFIG.OUTPUT_DIR, `analysis-${jobId}.json`);
  }
};

export default SHARED_CONFIG;
