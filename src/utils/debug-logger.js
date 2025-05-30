/**
 * Debug Logger Utility
 * Provides consistent logging for development
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const DebugLogger = {
  /**
   * Log navigation events
   */
  navigation: {
    stepClick: (stepIndex, stepLabel, isClickable) => {
      if (isDevelopment) {
        console.group('🎯 Step Navigation');
        console.log('Step Index:', stepIndex);
        console.log('Step Label:', stepLabel);
        console.log('Is Clickable:', isClickable);
        console.groupEnd();
      }
    },

    nextStep: (currentStep, newStep, canProceed) => {
      if (isDevelopment) {
        console.group('▶️ Next Step');
        console.log('Current Step:', currentStep);
        console.log('New Step:', newStep);
        console.log('Can Proceed:', canProceed);
        console.groupEnd();
      }
    },

    previousStep: (currentStep, newStep) => {
      if (isDevelopment) {
        console.group('🔙 Previous Step');
        console.log('Current Step:', currentStep);
        console.log('New Step:', newStep);
        console.groupEnd();
      }
    },
  },

  /**
   * Log workflow events
   */
  workflow: {
    stepCompleted: (stepIndex, stepData) => {
      if (isDevelopment) {
        console.group('✅ Step Completed');
        console.log('Step Index:', stepIndex);
        console.log('Step Data:', stepData);
        console.groupEnd();
      }
    },

    stepError: (stepIndex, error) => {
      if (isDevelopment) {
        console.group('❌ Step Error');
        console.log('Step Index:', stepIndex);
        console.error('Error:', error);
        console.groupEnd();
      }
    },

    processing: (step, progress, message) => {
      if (isDevelopment) {
        console.log(`🔄 Processing: ${step} (${progress}%) - ${message}`);
      }
    },
  },

  /**
   * Log component events
   */
  component: {
    mount: (componentName, props) => {
      if (isDevelopment) {
        console.group(`🔧 ${componentName} Mounted`);
        console.log('Props:', props);
        console.groupEnd();
      }
    },

    update: (componentName, changes) => {
      if (isDevelopment) {
        console.group(`🔄 ${componentName} Updated`);
        console.log('Changes:', changes);
        console.groupEnd();
      }
    },
  },

  /**
   * Log API events
   */
  api: {
    request: (endpoint, data) => {
      if (isDevelopment) {
        console.group('📡 API Request');
        console.log('Endpoint:', endpoint);
        console.log('Data:', data);
        console.groupEnd();
      }
    },

    response: (endpoint, response) => {
      if (isDevelopment) {
        console.group('📡 API Response');
        console.log('Endpoint:', endpoint);
        console.log('Response:', response);
        console.groupEnd();
      }
    },

    error: (endpoint, error) => {
      if (isDevelopment) {
        console.group('📡 API Error');
        console.log('Endpoint:', endpoint);
        console.error('Error:', error);
        console.groupEnd();
      }
    },
  },

  /**
   * General purpose logging
   */
  info: (message, data) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  },

  warn: (message, data) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  },

  error: (message, error) => {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error || '');
    }
  },
};

export default DebugLogger;
