// test/e2e/04-generation.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { MOCK_RESUME_NAME_FRAGMENT } from "../fixtures/mock-constants";

const SAMPLE_YAML = readFileSync(join(__dirname, "../fixtures/sample-resume.yaml"), "utf-8");
const SAMPLE_JD = readFileSync(join(__dirname, "../fixtures/sample-jd.txt"), "utf-8");

test.describe("Scenario 4: Resume generation", () => {
  test.beforeEach(async ({ request }) => {
    await request.put("/api/master-resume", { data: { yaml_content: SAMPLE_YAML } });
  });

  test("paste JD, generate, PDF preview renders", async ({ page }) => {
    await page.goto("/");
    // Open the Generate view (editor is the default view)
    await page.locator("[data-testid=nav-generate]").click();
    // Paste job description
    await page.locator("[data-testid=job-description]").fill(SAMPLE_JD);
    // Click generate
    await page.locator("[data-testid=generate-button]").click();
    // Wait for generation to complete (PDF preview appears)
    await expect(page.locator("[data-testid=generated-resume-preview]")).toBeVisible({ timeout: 30_000 });
    // Resume name displayed with correct content
    await expect(page.locator("[data-testid=resume-name]").first()).toContainText(MOCK_RESUME_NAME_FRAGMENT);
  });
});
