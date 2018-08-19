# Automatic deobfuscator for Minecraft
![License](https://img.shields.io/github/license/skyrising/mc-deobfuscator.svg)

Automatically generates mappings for any Minecraft version.

Generated mappings: [mc-data](https://github.com/skyrising/mc-data)

## Use
### Installing & building
```shell
yarn install
yarn run build
```

### Running
Run for single version:
```shell
yarn start <version or jar file>
```

Run for development (doesn't require rebuilding):
```shell
yarn run dev <version or jar file>
```

Generate [mc-data](https://github.com/skyrising/mc-data) repository:
```shell
env WORKERS=<number> MINECRAFT_JARS_CACHE=<directory> yarn run data [none | from [to]]
```
