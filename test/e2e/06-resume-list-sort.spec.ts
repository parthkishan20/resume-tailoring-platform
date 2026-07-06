// test/e2e/06-resume-list-sort.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const SAMPLE_YAML = readFileSync(join(__dirname, "../fixtures/sample-resume.yaml"), "utf-8");

test.describe("Scenario 6: Resume list sort", () => {
  test.beforeEach(async ({ request }) => {
    await request.put("/api/master-resume", { data: { yaml_content: SAMPLE_YAML } });
    // Create a resume via API to ensure list is populated
    await request.post("/api/resumes/stream", {
      data: { job_description: "Alpha Corp — Engineer" },
    }).catch(() => {}); // SSE endpoint, response may not parse as JSON
  });

  test("sort by date and by JD buttons work", async ({ page }) => {
    await page.goto("/");
    // Navigate to history tab
    await page.getByText("Resumes").click();
    // Sort controls visible
    await expect(page.locator("[data-testid=sort-date]")).toBeVisible();
    await expect(page.locator("[data-testid=sort-jd]")).toBeVisible();
    // Click sort by JD
    await page.locator("[data-testid=sort-jd]").click();
    // List container still visible
    await expect(page.locator("[data-testid=resume-list]")).toBeVisible();
    // List items rendered
    await expect(page.locator("[data-testid=resume-list-item]").first()).toBeVisible();
    // Click back to date sort
    await page.locator("[data-testid=sort-date]").click();
    await expect(page.locator("[data-testid=resume-list]")).toBeVisible();
    // List items rendered after re-sort
    await expect(page.locator("[data-testid=resume-list-item]").first()).toBeVisible();
  });
});
