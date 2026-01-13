# Test Automation Project

Automated testing suite using Playwright for end-to-end testing.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

```bash
npm install
```

## Running Tests

Run all tests:
```bash
npx playwright test
```

Run a specific test file:
```bash
npx playwright test tests/loginDev.spec.ts
```

Run tests in headed mode:
```bash
npx playwright test --headed
```

Run tests in debug mode:
```bash
npx playwright test --debug
```

## Test Structure

The project contains the following test suites:

- `allUsers.spec.ts` - User management tests
- `loginDev.spec.ts` - Login functionality tests
- `checkCreditByStory.spec.ts` - Credit verification tests
- `checkLastCreditToWallet.spec.ts` - Wallet credit tests
- `move.spec.ts` - Move functionality tests
- `moveChackTotleByTotle.spec.ts` - Total verification tests
- `moveChanStorByName.spec.ts` - Story management tests
- `moveChanStory.spec.ts` - Story channel tests
- `moveChanStoryDev.spec.ts` - Development story tests
- `moveCountTheChan.spec.ts` - Channel counting tests
- `moveNoUsed.spec.ts` - Unused items tests

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Test reports are generated in the `playwright-report/` directory.

## Test Results

Test results and outputs are stored in:
- `test-results/` - Test execution results
- `tests/output/` - Custom test output files

## Configuration

Test configuration is defined in `playwright.config.ts`. Key settings:
- Test timeout: 10 minutes
- Fully parallel execution
- HTML reporter
- Retry on CI: 2 times

## Repository

- Repository: https://github.com/mualee/test
- Issues: https://github.com/mualee/test/issues

## License

ISC
