import { exec } from 'child_process'
import validatePackageName from 'validate-npm-package-name'

import { generate } from '@rematter/genql/src/main'
import { promises as fs } from 'fs'
import fsx from 'fs-extra'
import { lexicographicSortSchema } from 'graphql'
import path from 'path'
import resolve from 'resolve'
import tmp from 'tmp-promise'
import { NPM_SCOPE, websiteUrl } from '../constants'

import { fetchSchemaWithRetry } from '@rematter/genql/src/schema/fetchSchema'
import { generateQueries } from './generateQueries'

function generateReadme({ slug, host, queriesCode }) {
    return `

# ${host} TypeScript API client

GraphQL client for ${host} with full TypeScript support

## Installation

\`\`\`
npm install ${NPM_SCOPE}/${slug}
\`\`\`

## Docs

You can read more about usage in the [client docs](${websiteUrl}/apis/${slug}) and [Genql docs](${websiteUrl}/docs)

## Example usage

\`\`\`js
${queriesCode}
\`\`\`

## Sponsor

This project is sponsored by [Notaku](https://notaku.so/product/docs): Create public docs websites from your Notion pages

[![Notaku](https://notaku.so/github_banner.jpg)](https://notaku.so)

`
}

export function runCommand({ cmd, cwd, env = {} }) {
    return new Promise((res, rej) => {
        let stderr = ''
        let stdout = ''
        const ps = exec(
            cmd,
            { cwd, env: { ...process.env, ...env } },
            (err, stdout, stderr) => {
                if (err) {
                    rej(new Error(`${cmd} failed: ${stdout}\n${stderr}\n`))
                }
                res(stdout)
            },
        )
        ps.stderr.on('data', (data) => {
            stderr += data.toString()
        })
        ps.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        ps.stdout.pipe(process.stdout)
        ps.stderr.pipe(process.stdout)
    })
}

export async function createPackageAndPublish({
    url,
    slug,
    version = '0.0.0',
    npmScope,
    doNotPublish,
    npmToken,
}: {
    doNotPublish: boolean
    npmToken?: string
    slug: string
    url: string
    version?: string
    npmScope: string
}) {
    const packageName = `${npmScope}/${slug}`
    const valid = validatePackageName(packageName)
    if (!valid.validForNewPackages) {
        throw new Error(`Invalid npm package name ${packageName}`)
    }
    let schema = await fetchSchemaWithRetry({ endpoint: url })
    if (schema) {
        schema = lexicographicSortSchema(schema)
    }

    let queriesCode = await generateQueries({
        packageName,
        schema,
    })
    const { path: tmpPath, cleanup } = await tmp.dir({
        unsafeCleanup: true,
    })
    console.log('tmpPath', slug, tmpPath)
    const host = new URL(url).host
    try {
        const packageJson = {
            name: packageName,
            description: `SDK client for ${host} GraphQL API`,
            version: version,
            main: './dist/index.js',
            files: ['dist', 'src', 'README.md', 'package.json'],
            // module: './index.esm.js',
            sideEffects: false,
            keywords: [host, 'graphql', 'sdk', 'typescript', 'genql'],
            repository: {
                type: 'git',
                url: 'https://github.com/remorses/genql',
            },
            homepage: `${websiteUrl}/apis/${slug}`,
            types: './dist/index.d.ts',
            dependencies: {
                // graphql: '^16.6.0',
                undici: '^5.18.0',
                'native-fetch': '^4.0.2',
            },
        }

        await generate({
            endpoint: url,
            output: path.resolve(tmpPath, 'src'),
            fetchImport: "import { fetch } from 'native-fetch'",
        })

        await fs.writeFile(
            path.join(tmpPath, 'package.json'),
            JSON.stringify(packageJson, null, 4),
        )
        // await fs.writeFile(
        //     path.join(tmpPath, 'src/index.ts'),
        //     generateIndex({}),
        // )
        await fs.writeFile(
            path.join(tmpPath, 'tsconfig.json'),
            JSON.stringify(tsconfig, null, 4),
        )
        // await runCommand({ cmd: `tree`, cwd: tmpPath })
        // await runCommand({ cmd: `pnpm i`, cwd: tmpPath })
        // await runCommand({ cmd: `npm i`, cwd: tmpPath })
        // copy native-fetch into node_modules
        fsx.copySync(
            path.resolve(resolve.sync('native-fetch/package.json'), '..'),
            path.join(tmpPath, 'node_modules/native-fetch'),
            { dereference: true, overwrite: true },
        )
        await runCommand({ cmd: `tsc`, cwd: tmpPath })
        // await runCommand({ cmd: `tree`, cwd: tmpPath })

        const readme = generateReadme({
            queriesCode,
            host,
            slug,
        })
        await fs.writeFile(path.join(tmpPath, 'README.md'), readme)
        if (!doNotPublish) {
            console.log(`publishing ${slug}`)
            await runCommand({
                cmd: `npm publish --access public`,
                cwd: tmpPath,
                env: npmToken ? { NPM_TOKEN: npmToken } : null,
            })
        }
        // await cleanup()
        return { packageJson, queriesCode, tempFolder: tmpPath }
    } catch (e) {
        throw new Error('Could not publish: ' + String(e))
        return { packageJson: {}, tempFolder: '' }
    } finally {
    }
}

const tsconfig = {
    compilerOptions: {
        noImplicitReturns: true,
        noUnusedParameters: false,
        rootDir: 'src',
        noImplicitAny: false,
        strict: true,
        declaration: true,
        target: 'ES2015',
        module: 'CommonJS',
        moduleResolution: 'node',
        resolveJsonModule: true,
        outDir: './dist',
        esModuleInterop: true,
        allowJs: true,
        sourceMap: true,
        lib: ['dom', 'es2017', 'ES2015', 'esnext.asynciterable'],
        skipLibCheck: true,
        isolatedModules: true,
    },
    include: ['src'],
    exclude: [
        'node_modules',
        'package.json',
        '**/*.case.ts',
        'tests',
        'example',
        'dist',
        '**/__tests__',
    ],
}
