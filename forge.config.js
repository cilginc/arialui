const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const path = require("path");

module.exports = {
  packagerConfig: {
    name: "AriaLUI",
    executableName: "AriaLUI",
    icon: path.resolve(__dirname, "resources/icon.ico"),
    asar: true,
    ignore: [
      /^\/src/, // Ignore source files
      /^\/\.git/, // Ignore git
      /^\/node_modules\/.*\/test/, // Ignore test folders in node_modules
      /\.tsx?$/, // Ignore TypeScript source files
      /^\/tsconfig.*\.json$/,
    ],
    win32metadata: {
      CompanyName: "cilginc",
      FileDescription: "AriaLUI Download Manager",
      OriginalFilename: "AriaLUI.exe",
      ProductName: "AriaLUI",
      InternalName: "AriaLUI",
      icon: path.resolve(__dirname, "resources/icon.ico"),
    },
  },
  rebuildConfig: {},
  makers: [
    // Windows Installer (Squirrel)
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupIcon: path.resolve(__dirname, "resources/icon.ico"),
        authors: "cilginc",
        description:
          "An IDM like Download Manager with Different Backends support",
        loadingGif: path.resolve(__dirname, "resources/icon.png"),
        setupExe: `AriaLUI-${require("./package.json").version}-Setup.exe`,
      },
    },
    // macOS ZIP (for direct download)
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    // Linux Debian Package
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "arialui",
          productName: "AriaLUI",
          genericName: "Download Manager",
          description:
            "An IDM like Download Manager with Different Backends support",
          categories: ["Network", "FileTransfer"],
          homepage: "https://github.com/cilginc/arialui",
          icon: path.resolve(__dirname, "resources/icon.png"),
          maintainer: "cilginc",
          section: "net",
        },
      },
    },
    // Linux RPM Package
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          name: "arialui",
          productName: "AriaLUI",
          genericName: "Download Manager",
          description:
            "An IDM like Download Manager with Different Backends support",
          categories: ["Network", "FileTransfer"],
          homepage: "https://github.com/cilginc/arialui",
          icon: path.resolve(__dirname, "resources/icon.png"),
          license: "MIT",
        },
      },
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "cilginc",
          name: "arialui",
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
