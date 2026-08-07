import { useCallback, useState } from "react";
import {
  loadUserTemplatesFromStorage,
  removeUserTemplate,
  saveUserTemplatesToStorage,
  upsertUserTemplate,
  type CabinetTemplate,
} from "../domain/cabinetTemplates";

export function useUserTemplates() {
  const [templates, setTemplates] = useState<CabinetTemplate[]>(() =>
    loadUserTemplatesFromStorage(),
  );

  const saveTemplate = useCallback((template: CabinetTemplate) => {
    setTemplates((prev) => {
      const next = upsertUserTemplate(prev, template);
      saveUserTemplatesToStorage(next);
      return next;
    });
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((prev) => {
      const next = removeUserTemplate(prev, templateId);
      saveUserTemplatesToStorage(next);
      return next;
    });
  }, []);

  return {
    templates,
    saveTemplate,
    deleteTemplate,
  };
}
