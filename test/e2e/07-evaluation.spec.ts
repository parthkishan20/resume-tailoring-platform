// test/e2e/07-evaluation.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  MOCK_EVALUATION_SCORE,
  MOCK_MISSING_KEYWORD,
  MOCK_MATCHED_KEYWORD,
} from "../fixtures/mock-constants";

const SAMPLE_YAML = readFileSync(join(__dirname, "../fixtures/sample-resume.yaml"), "utf-8");
const SAMPLE_JD = readFileSync(join(__dirname, "../fixtures/sample-jd.txt"), "utf-8");

test.describe("Scenario 7: Evaluation", () => {
  test.beforeEach(async ({ request }) => {
    await request.put("/api/master-resume", { data: { yaml_content: SAMPLE_YAML } });
  });

  test("score and critique returned and displayed", async ({ page }) => {
    await page.goto("/");
    // Navigate to evaluate tab
    await page.getByText("evaluate", { exact: false }).click();
    // Fill JD and evaluate — use placeholder to select evaluation textarea (not chat textarea)
    await page.locator("textarea[placeholder*='Paste the job description']").fill(SAMPLE_JD);
    await page.locator("[data-testid=evaluate-button]").click();
    // Wait for result
    await expect(page.locator("[data-testid=evaluate-result]")).toBeVisible({ timeout: 30_000 });
    // Check score (72 from mock)
    await expect(page.locator("[data-testid=evaluate-result]")).toContainText(
      `${MOCK_EVALUATION_SCORE}`
    );
    // Check keywords
    await expect(page.locator("[data-testid=evaluate-result]")).toContainText(MOCK_MATCHED_KEYWORD);
    await expect(page.locator("[data-testid=evaluate-result]")).toContainText(MOCK_MISSING_KEYWORD);
  });
});
