import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const SOURCES = [
  {
    file: path.join(PUBLIC_DIR, "converted_coursesd.json"),
    source: "converted_coursesd",
    normalizer: normalizeConverted,
  },
  {
    file: path.join(PUBLIC_DIR, "data.json"),
    source: "data_json",
    normalizer: normalizeDataJson,
  },
  {
    file: path.join(PUBLIC_DIR, "opt_all_courses_with_experience.json"),
    source: "opt_all_courses_with_experience",
    normalizer: normalizeOptAllCoursesWithExperience,
  },
];

async function main() {
  const merged = [];

  for (const { file, source, normalizer } of SOURCES) {
    const raw = await fs.readFile(file, "utf8");
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload)) {
      console.warn(`Skipping ${file}: JSON root is not an array.`);
      continue;
    }
    payload.forEach((item) => {
      const normalized = normalizer(item);
      normalized.source = source;
      merged.push(normalized);
    });
  }

  const outputFile = path.join(PUBLIC_DIR, "courses.json");
  await fs.writeFile(
    outputFile,
    JSON.stringify(merged, null, 2),
    "utf8"
  );

  console.log(`✅ Merged ${merged.length} course entries into ${outputFile}`);
}

function normalizeConverted(item) {
  return {
    course: safeTrim(item.course),
    teacher: safeTrim(item.teacher),
    review: safeTrim(item.review),
    score: toStringOrEmpty(item.score),
    difficulty: toNumberOrNull(item.difficulty),
    semester: toStringOrEmpty(item.semester),
    tag: Array.isArray(item.tag) ? item.tag.filter(Boolean) : [],
    school: toStringOrEmpty(item.school),
    experience: safeTrim(item.experience),
  };
}

function normalizeDataJson(item) {
  return {
    course: safeTrim(item.course),
    teacher: safeTrim(item.teacher),
    review: safeTrim(item.review),
    score: toStringOrEmpty(item.score),
    difficulty: toNumberOrNull(item.difficulty),
    semester: toStringOrEmpty(item.semester),
    tag: Array.isArray(item.tag) ? item.tag.filter(Boolean) : [],
    school: toStringOrEmpty(item.school),
  };
}

function normalizeOptAllCoursesWithExperience(item) {
  return {
    course: safeTrim(item.course_name ?? item.course),
    teacher: safeTrim(item.professor ?? item.teacher),
    review: safeTrim(item.content ?? item.review),
    score: toStringOrEmpty(item.total_rating ?? item.score),
    difficulty: toNumberOrNull(item.difficulty ?? item.total_rating),
    semester: toStringOrEmpty(item.semester),
    tag: Array.isArray(item.classTags)
      ? item.classTags.filter(Boolean)
      : Array.isArray(item.tag)
      ? item.tag.filter(Boolean)
      : [],
    school: toStringOrEmpty(item.school),
    experience: safeTrim(item.experience),
  };
}

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : value ?? "";
}

function toStringOrEmpty(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

main().catch((err) => {
  console.error("❌ Failed to merge course data:", err);
  process.exitCode = 1;
});
