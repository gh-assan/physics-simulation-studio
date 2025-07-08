# Contributing to Physics Simulation Studio

We welcome contributions to the Physics Simulation Studio! By contributing, you're helping to build a versatile and powerful tool for simulating physical phenomena.

## How to Contribute

1.  **Fork the Repository:** Start by forking the `physics-simulation-studio` repository to your GitHub account.

2.  **Clone Your Fork:** Clone your forked repository to your local machine:
    ```bash
    git clone https://github.com/YOUR_USERNAME/physics-simulation-studio.git
    cd physics-simulation-studio
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Create a New Branch:** Create a new branch for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b bugfix/your-bug-fix-name
    ```

5.  **Make Your Changes:** Implement your feature or bug fix. Ensure your code adheres to the existing coding style and conventions.

6.  **Run Tests:** Before committing, make sure all tests pass and add new tests for your changes if applicable:
    ```bash
    npm test
    ```

7.  **Build the Project:** Ensure the project builds without errors:
    ```bash
    npm run build
    ```

8.  **Commit Your Changes:** Write a clear and concise commit message. Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification if possible (e.g., `feat: add new rigid body component`, `fix: resolve rendering issue`).
    ```bash
    git commit -m "feat: describe your feature or fix"
    ```

9.  **Push to Your Fork:**
    ```bash
    git push origin feature/your-feature-name
    ```

10. **Create a Pull Request:** Go to the original `physics-simulation-studio` repository on GitHub and create a pull request from your forked branch. Provide a detailed description of your changes.

## Code Style

We use Prettier for code formatting. Please ensure your code is formatted correctly before submitting a pull request. You can run Prettier manually:

```bash
# (Coming soon: Add Prettier script to package.json)
```

## Reporting Bugs

If you find a bug, please open an issue on the [GitHub Issues page](https://github.com/gh-assan/physics-simulation-studio/issues). Provide as much detail as possible, including steps to reproduce the bug, expected behavior, and actual behavior.

## Feature Requests

We welcome feature requests! Please open an issue on the [GitHub Issues page](https://github.com/gh-assan/physics-simulation-studio/issues) and describe your idea in detail.

Thank you for contributing to Physics Simulation Studio!