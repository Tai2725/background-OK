'use client';

/**
 * Session Manager cho Background Generator
 * Quản lý trạng thái và session persistence cho từng bước xử lý
 */

const SESSION_KEY = 'background_generator_session';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 giờ

export const STEP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ERROR: 'error',
  SKIPPED: 'skipped',
};

export const PROCESSING_STEPS = {
  UPLOAD: 'upload',
  STYLE_SELECTION: 'style_selection',
  BACKGROUND_REMOVAL: 'background_removal',
  BACKGROUND_GENERATION: 'background_generation',
  FINAL_PROCESSING: 'final_processing',
};

export class SessionManager {
  /**
   * Khởi tạo session mới
   */
  static initializeSession(userId) {
    // Use crypto.randomUUID if available, fallback to timestamp-based ID
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `session_${crypto.randomUUID()}`;
      }
      // Fallback for environments without crypto.randomUUID
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000).toString(36);
      return `session_${timestamp}_${random}`;
    };

    const now = Date.now();
    const session = {
      id: generateId(),
      userId,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + SESSION_EXPIRY,
      currentStep: PROCESSING_STEPS.UPLOAD,
      steps: {
        [PROCESSING_STEPS.UPLOAD]: {
          status: STEP_STATUS.PENDING,
          data: null,
          error: null,
          attempts: 0,
          completedAt: null,
        },
        [PROCESSING_STEPS.STYLE_SELECTION]: {
          status: STEP_STATUS.PENDING,
          data: null,
          error: null,
          attempts: 0,
          completedAt: null,
        },
        [PROCESSING_STEPS.BACKGROUND_REMOVAL]: {
          status: STEP_STATUS.PENDING,
          data: null,
          error: null,
          attempts: 0,
          completedAt: null,
        },
        [PROCESSING_STEPS.BACKGROUND_GENERATION]: {
          status: STEP_STATUS.PENDING,
          data: null,
          error: null,
          attempts: 0,
          completedAt: null,
        },
        [PROCESSING_STEPS.FINAL_PROCESSING]: {
          status: STEP_STATUS.PENDING,
          data: null,
          error: null,
          attempts: 0,
          completedAt: null,
        },
      },
      results: {
        originalImageUrl: null,
        originalImageFile: null,
        selectedStyle: null,
        customPrompt: null,
        backgroundRemovedUrl: null,
        finalImageUrl: null,
        imageRecordId: null,
      },
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Lấy session hiện tại
   */
  static getCurrentSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Kiểm tra expiry
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Lưu session
   */
  static saveSession(session) {
    try {
      session.updatedAt = Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  /**
   * Cập nhật trạng thái của một bước
   */
  static updateStepStatus(stepName, status, data = null, error = null) {
    const session = this.getCurrentSession();
    if (!session) return false;

    const step = session.steps[stepName];
    if (!step) return false;

    // Cập nhật step
    step.status = status;
    step.updatedAt = Date.now();

    if (data) {
      step.data = data;
    }

    if (error) {
      step.error = error;
      step.attempts = (step.attempts || 0) + 1;
    }

    if (status === STEP_STATUS.COMPLETED) {
      step.completedAt = Date.now();
      step.error = null;

      // Tự động chuyển sang bước tiếp theo
      const stepOrder = Object.keys(PROCESSING_STEPS);
      const currentIndex = stepOrder.findIndex((key) => PROCESSING_STEPS[key] === stepName);
      const nextStepKey = stepOrder[currentIndex + 1];

      if (nextStepKey) {
        session.currentStep = PROCESSING_STEPS[nextStepKey];
      }
    }

    return this.saveSession(session);
  }

  /**
   * Cập nhật kết quả xử lý
   */
  static updateResults(results) {
    const session = this.getCurrentSession();
    if (!session) return false;

    session.results = { ...session.results, ...results };
    return this.saveSession(session);
  }

  /**
   * Kiểm tra xem một bước có thể thực hiện được không
   */
  static canExecuteStep(stepName) {
    const session = this.getCurrentSession();
    if (!session) return false;

    const stepOrder = [
      PROCESSING_STEPS.UPLOAD,
      PROCESSING_STEPS.STYLE_SELECTION,
      PROCESSING_STEPS.BACKGROUND_REMOVAL,
      PROCESSING_STEPS.BACKGROUND_GENERATION,
      PROCESSING_STEPS.FINAL_PROCESSING,
    ];

    const targetIndex = stepOrder.indexOf(stepName);
    if (targetIndex === -1) return false;

    // Kiểm tra các bước trước đó đã hoàn thành chưa
    for (let i = 0; i < targetIndex; i++) {
      const prevStep = session.steps[stepOrder[i]];
      if (prevStep.status !== STEP_STATUS.COMPLETED) {
        return false;
      }
    }

    return true;
  }

  /**
   * Lấy bước hiện tại có thể thực hiện
   */
  static getCurrentExecutableStep() {
    const session = this.getCurrentSession();
    if (!session) return null;

    const stepOrder = [
      PROCESSING_STEPS.UPLOAD,
      PROCESSING_STEPS.STYLE_SELECTION,
      PROCESSING_STEPS.BACKGROUND_REMOVAL,
      PROCESSING_STEPS.BACKGROUND_GENERATION,
      PROCESSING_STEPS.FINAL_PROCESSING,
    ];

    for (const stepName of stepOrder) {
      const step = session.steps[stepName];
      if (step.status === STEP_STATUS.PENDING || step.status === STEP_STATUS.ERROR) {
        return stepName;
      }
    }

    return null; // Tất cả đã hoàn thành
  }

  /**
   * Reset một bước cụ thể (để retry)
   */
  static resetStep(stepName) {
    const session = this.getCurrentSession();
    if (!session) return false;

    const step = session.steps[stepName];
    if (!step) return false;

    step.status = STEP_STATUS.PENDING;
    step.error = null;
    step.completedAt = null;

    // Reset current step về bước này
    session.currentStep = stepName;

    return this.saveSession(session);
  }

  /**
   * Reset session về trạng thái ban đầu (giữ userId)
   */
  static resetSession() {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return false;

    // Tạo session mới với cùng userId
    const newSession = this.initializeSession(currentSession.userId);
    return newSession;
  }

  /**
   * Xóa session
   */
  static clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  /**
   * Lấy progress tổng thể (%)
   */
  static getOverallProgress() {
    const session = this.getCurrentSession();
    if (!session) return 0;

    const steps = Object.values(session.steps);
    const completedSteps = steps.filter((step) => step.status === STEP_STATUS.COMPLETED).length;

    return Math.round((completedSteps / steps.length) * 100);
  }

  /**
   * Kiểm tra xem có lỗi nào cần retry không
   */
  static hasRetryableErrors() {
    const session = this.getCurrentSession();
    if (!session) return false;

    return Object.values(session.steps).some((step) => step.status === STEP_STATUS.ERROR);
  }

  /**
   * Lấy danh sách các bước có lỗi
   */
  static getErrorSteps() {
    const session = this.getCurrentSession();
    if (!session) return [];

    return Object.entries(session.steps)
      .filter(([_, step]) => step.status === STEP_STATUS.ERROR)
      .map(([stepName, step]) => ({ stepName, ...step }));
  }
}
