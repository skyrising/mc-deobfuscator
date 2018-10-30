// @flow
import fs from 'fs'
import path from 'path'

export function createWorkspace (workspaceDir: string, workspace: IDEWorkspace) {
  const ideaDir = path.resolve(workspaceDir, '.idea')
  if (!fs.existsSync(ideaDir)) fs.mkdirSync(ideaDir)
  const libDir = path.resolve(ideaDir, 'libraries')
  if (!fs.existsSync(libDir)) fs.mkdirSync(libDir)
  writeModules(ideaDir, workspace.projects)
  fs.writeFileSync(path.resolve(ideaDir, 'misc.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectRootManager" version="2" project-jdk-name="1.8" project-jdk-type="JavaSDK" />
</project>`)
}

function writeModules (dir: string, modules: Array<IDEProject>) {
  for (const module of modules) writeModule(dir, module)
  const file = path.resolve(dir, 'modules.xml')
  const previous = []
  if (fs.existsSync(file)) {
    previous.push(...fs.readFileSync(file, 'utf8').split('\n').filter(line => line.includes('<module ')).map(s => s.trim()))
  }
  const newModules = modules.map(module => `<module fileurl="file://$PROJECT_DIR$/.idea/${module.name}.iml" filepath="$PROJECT_DIR$/.idea/${module.name}.iml" />`)
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>${[...new Set([...previous, ...newModules])].map(line => '\n      ' + line).join('')}
    </modules>
  </component>
</project>
`)
}

function writeModule (dir: string, module: IDEProject) {
  const file = path.resolve(dir, module.name + '.iml')
  for (const lib of module.libraries) writeLibrary(dir, lib)
  const libraryLines = [...new Set(module.libraries.map(lib => `<orderEntry type="library" exported="" name="${lib.id}" level="project" />`))]
  const sourceLines = module.sources.map(source => `<sourceFolder url="file://$MODULE_DIR$/${path.relative(path.resolve(dir, '..'), source)}" isTestSource="false" />`)
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>
<module type="JAVA_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$">${sourceLines.map(line => '\n      ' + line).join('')}
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />${libraryLines.map(line => '\n    ' + line).join('')}
  </component>
</module>`)
}

function libId (id) {
  return id.replace(/[^A-Za-z0-9]/g, '_')
}

function writeLibrary (dir: string, library: {id: string, path: string}) {
  const file = path.resolve(dir, 'libraries', libId(library.id) + '.xml')
  fs.writeFileSync(file, `<component name="libraryTable">
  <library name="${library.id}">
    <CLASSES>
      <root url="jar://${library.path}!/" />
    </CLASSES>
    <JAVADOC />
    <SOURCES />
  </library>
</component>`)
}
