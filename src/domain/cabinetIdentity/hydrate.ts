import type { InteriorObjectEntity } from "../interiorProject/types";
import type { InteriorValidationIssue } from "../interiorProject/types";
import { catalogBindingFor } from "./catalogBindings";
import { parseCabinetType } from "./parseType";
import { readCabinetIdentity, readIdentityExtension } from "./read";
import { persistCabinetIdentityOnObject } from "./write";

function issue(
  objectId: string,
  code: string,
  message: string,
  repaired: boolean,
): InteriorValidationIssue {
  return {
    severity: repaired ? "warning" : "warning",
    code,
    path: `objects.${objectId}`,
    message,
    repaired,
  };
}

/** Attach explicit identity from catalog id. Never infers type from category. */
export function hydrateCabinetIdentities(
  objects: InteriorObjectEntity[],
  issues: InteriorValidationIssue[],
): InteriorObjectEntity[] {
  return objects.map((object) => {
    const binding = catalogBindingFor(object.catalogItemId);
    if (object.kind !== "cabinet") {
      if (!binding?.production) return object;
      issues.push(issue(
        object.id,
        "cabinet-production-promoted",
        `Promoted ${object.name} to production family ${binding.familyId} from its catalog identity.`,
        true,
      ));
      return persistCabinetIdentityOnObject({ ...object, kind: "cabinet" });
    }
    if (readIdentityExtension(object.extensions)) return object;
    const identity = readCabinetIdentity(object);
    if (!identity) {
      if (binding) return object;
      const looksProduction = object.category === "storage" || Boolean(parseCabinetType(object.category));
      if (looksProduction) {
        issues.push(issue(
          object.id,
          "cabinet-identity-missing",
          "Cabinet has no explicit type/family; it will not be treated as a production cabinet.",
          false,
        ));
      }
      return object;
    }
    issues.push(issue(
      object.id,
      "cabinet-identity-hydrated",
      "Attached explicit cabinet type and family from catalog id.",
      true,
    ));
    return persistCabinetIdentityOnObject(object);
  });
}
