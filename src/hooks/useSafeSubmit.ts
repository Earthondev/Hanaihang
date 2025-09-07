import { useRef, useState } from "react";

import { useToast } from "../components/feedback/Toast";

interface SubmitOptions {
  formName: string;
  successMessage?: string;
  errorMessage?: string;
}

export function useSafeSubmit({ 
  formName, 
  successMessage = "บันทึกสำเร็จ 🎉", 
  errorMessage = "เกิดข้อผิดพลาดในการบันทึก" 
}: SubmitOptions) {
  const [isLoading, setLoading] = useState(false);
  const attemptIdRef = useRef<string>("");
  const { push } = useToast();

  async function run<T>(fn: () => Promise<T>) {
    if (isLoading) return; // กันกดซ้ำ
    setLoading(true);

    const attemptId = attemptIdRef.current = crypto.randomUUID();
    const startedAt = performance.now();
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'form_submit', {
        event_category: 'form_actions',
        event_label: formName,
        custom_parameter: {
          attempt_id: attemptId,
          form: formName
        }
      });
    }

    try {
      const result = await fn();
      const duration = Math.round(performance.now() - startedAt);
      
      // Success analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'form_submit_success', {
          event_category: 'form_actions',
          event_label: formName,
          value: duration,
          custom_parameter: {
            attempt_id: attemptId,
            form: formName,
            duration_ms: duration
          }
        });
      }
      
      push(successMessage, "success");
      return result;
    } catch (e: any) {
      const duration = Math.round(performance.now() - startedAt);
      const message = e?.message ?? errorMessage;
      const code = e?.code ?? e?.status ?? "unknown";
      
      // Error analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'form_submit_error', {
          event_category: 'form_actions',
          event_label: formName,
          value: duration,
          custom_parameter: {
            attempt_id: attemptId,
            form: formName,
            duration_ms: duration,
            error_code: code
          }
        });
      }
      
      push(message, "error");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { isLoading, run };
}
