import { useMutation } from '@apollo/client/react';
import { toast } from 'react-hot-toast';
import { RECORD_FAILED_SCAN } from '../lib/graphql/mutations';

export interface FailedScanInput {
  qrCode: string;
  errorMessage: string;
  scanMethod: string;
  eventId?: string;
  mealId?: string;
  notes?: string;
}

export interface FailedScanResult {
  success: boolean;
  message: string;
  auditLogId?: string;
}

export interface UseFailedScanRecordingReturn {
  recordFailedScan: (input: FailedScanInput) => Promise<FailedScanResult | null>;
  loading: boolean;
  error: any;
}

/**
 * Custom hook for recording failed QR code scan attempts
 * Provides audit trail and security monitoring for failed scans
 */
export const useFailedScanRecording = (): UseFailedScanRecordingReturn => {
  const [recordFailedScanMutation, { loading, error }] = useMutation(RECORD_FAILED_SCAN);

  const recordFailedScan = async (input: FailedScanInput): Promise<FailedScanResult | null> => {
    try {
      const { data } = await recordFailedScanMutation({
        variables: {
          input: {
            qrCode: input.qrCode,
            errorMessage: input.errorMessage,
            scanMethod: input.scanMethod,
            eventId: input.eventId,
            mealId: input.mealId,
            notes: input.notes,
          },
        },
      });

      if (data?.recordFailedScan?.success) {
        // Silent success - we don't want to show toast for failed scan recording
        // as it would be confusing to users
        console.log('Failed scan recorded:', data.recordFailedScan.message);
        return data.recordFailedScan;
      } else {
        console.error('Failed to record failed scan:', data?.recordFailedScan?.message);
        return null;
      }
    } catch (err) {
      console.error('Error recording failed scan:', err);
      // Don't show user-facing error for failed scan recording
      // This is a background audit operation
      return null;
    }
  };

  return {
    recordFailedScan,
    loading,
    error,
  };
};

/**
 * Helper function to create a failed scan record with consistent structure
 */
export const createFailedScanRecord = (
  qrCode: string,
  errorMessage: string,
  scanMethod: 'Manual Entry' | 'Camera Scan' | 'Scanner Device',
  context?: {
    eventId?: string;
    mealId?: string;
    notes?: string;
  }
): FailedScanInput => {
  return {
    qrCode,
    errorMessage,
    scanMethod,
    eventId: context?.eventId,
    mealId: context?.mealId,
    notes: context?.notes,
  };
};
