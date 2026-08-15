export function millworkScheduleFileBase(projectName: string) {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "living-room";
  return `${slug}-millwork-schedule`;
}
