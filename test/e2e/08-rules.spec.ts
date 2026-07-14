// test/e2e/08-rules.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const SAMPLE_YAML = readFileSync(join(__dirname, "../fixtures/sample-resume.yaml"), "utf-8");
const SAMPLE_JD = readFileSync(join(__dirname, "../fixtures/sample-jd.txt"), "utf-8");

test.describe("Scenario 8: Generation rules", () => {
  test.beforeEach(async ({ request }) => {
    await request.put("/api/master-resume", { data: { yaml_content: SAMPLE_YAML } });
    await request.delete("/api/rules").catch(() => {}); // reset to defaults
  });

  test("rules form is visible and can update a value", async ({ page }) => {
    await page.goto("/");
    // Open the Generate view (editor is the default view)
    await page.locator("[data-testid=nav-generate]").click();
    // Open rules form
    await page.locator("[data-testid=rules-toggle]").click();
    await expect(page.locator("[data-testid=rules-form]")).toBeVisible();
    // Change a rule value
    const inputs = page.locator("[data-testid=rules-form] input");
    await inputs.first().fill("3");
    await inputs.first().blur(); // trigger onBlur save
    // No error visible
    await expect(page.locator("[data-testid=rules-form]")).toBeVisible();
  });

  test("generate after rule change works", async ({ page }) => {
    await page.goto("/");
    // Update a rule via API
    await page.request.put("/api/rules", {
      data: {
        rules: [{ section: "experience", rule_key: "max_entries", rule_value: "1" }],
      },
    });
    // Generate
    await page.locator("[data-testid=nav-generate]").click();
    await page.locator("[data-testid=job-description]").fill(SAMPLE_JD);
    await page.locator("[data-testid=generate-button]").click();
    await expect(page.locator("[data-testid=generated-resume-preview]")).toBeVisible({
      timeout: 30_000,
    });
  });
});
