# Automated Tests

Here is a list of the automated tests I wrote to make sure the core audit logic works correctly. 

How to run the tests:
Open your terminal in the Velqen folder and run `npm run test` or `npx vitest`

Files and what they cover:

tests/recommendations.test.ts
This file covers all the main logic for how the audit engine makes recommendations and finds savings. It includes tests that check if:
* The engine spots when a company pays for more seats than they actually have team members
* It flags when a team is using a tool that doesn't fit their main use case, like non developers paying for coding tools
* It catches small teams paying for expensive enterprise plans they don't actually need
* It correctly suggests switching from monthly to annual billing to save money
* It notices if a small team is paying for multiple tools that do the exact same thing
* It knows when a software setup is already perfect and shouldn't be changed
* The final audit result data is formatted correctly without errors

tests/smoke.test.js
This is just a simple sanity check file. It covers verifying that the testing framework itself is installed and running properly before doing any complex logic checks.
