// frontend/src/assets/index.ts (create this file to export your assets)
// Import your actual images
import lightModeIcon from './light-logo.png';
import darkModeIcon from './dark-logo.png';

export { lightModeIcon, darkModeIcon };

declare module '*.png' {
  const value: string;
  export default value;
}

