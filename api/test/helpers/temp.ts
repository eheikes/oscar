import { copyFileSync } from 'fs'
import { join, resolve } from 'path'
import { directory, file } from 'tempy'

const fixturesDir = resolve(__dirname, '..', 'fixtures')

interface FixtureList {
  [sourceFilename: string]: string
}

export const createTempDir = (fixtures: FixtureList = {}): string => {
  const dir = directory()
  for (let sourceFile in fixtures) {
    copyFileSync(
      join(fixturesDir, sourceFile),
      join(dir, fixtures[sourceFile])
    )
  }
  return dir
}

export const createTempFile = (): string => {
  return file()
}
