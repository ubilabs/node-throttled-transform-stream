# Contribution Guidelines

First off, thanks for contributing to this project :tada: :thumbsup:  
Our communications here on GitHub follow certain guidelines. Please observe the points below.

## Issue Tracker

- before submitting a new issue, please:

    - check for existing related issues

    - check the issue tracker for a specific upstream project that may be more appropriate

    - check against supported versions of this project (i.e. the latest)

- please keep discussions on-topic, and respect the opinions of others

- please contact us privately to discuss security vulnerabilities


## Pull Requests / Merge Requests

- **IMPORTANT**: by submitting a patch, you agree to allow the project owners to license your work under this [LICENSE](LICENSE.md)

- please provide test cases for all features and bug fixes

- provide documentation for all public API methods

- commit messages should follow the format outlined in [CONVENTIONS.md](CONVENTIONS.md)

### Code Style and Code Quality

- JavaScript

   - [ESLint](http://eslint.org/) configuration files are provided

   - run `npm run lint` to check code style

- run `npm run test` before submitting a PR to ensure that your code uses correct style and passes all tests

### Development

Clone the repository and run:

```sh
npm install
```

To run the tests, run:

```
npm test
```

To make a release, run:

```
npm run release patch|minor|major
```
