import NextLink from 'next/link'
import React from 'react'
import { Link, Stack, Box, useColorMode } from '@chakra-ui/core'

import { AuthProvider } from 'firebase-react-components'
import { LandingProvider, NavBar, Footer } from 'landing-blocks'

export const BG =
    'radial-gradient( 37.86% 77.79% at 50% 100%, rgba(113,128,150,0.25) 0%, rgba(113,128,150,0) 100% ), linear-gradient(180deg,#1a202c 0%,#2d3748 100%), linear-gradient(180deg,#0d0f14 0%,rgba(27,32,43,0) 100%),#2f3747'

export default function App(props) {
    const { Component, pageProps } = props
    return (
        <AuthProvider
            noPersistence // disable firebase persistence
            onLogin={async (user, creds) => {
                console.log(creds.toJSON())
            }}
            onError={(e) => alert(e.message)}
        >
            <LandingProvider background={BG} black='#333' primary='#D566C5'>
                <NavBar
                    dark
                    logo={
                        <Box fontWeight='medium' fontSize='24px'>
                            Genql
                        </Box>
                        // <Image
                        //     width='120px'
                        //     stroke='#000'
                        //     src='/logo_on_black.svg'
                        // />
                    }
                    navs={[
                        <a>Features</a>,
                        <a>Use Cases</a>,
                        <a>Pricing</a>,
                        <a>About Us</a>,
                        <a>Login</a>,
                    ]}
                />
                <Component {...pageProps} />
                <MyFooter dark />
            </LandingProvider>
        </AuthProvider>
    )
}

export const headingNavLinks = (
    <Stack isInline spacing='20px'>
        <MyLink href='/#components'>Components</MyLink>
        <MyLink href='/#demos'>Demos</MyLink>
        <MyLink href='#'>Newsletter</MyLink>,
        <Box />
    </Stack>
)

export function MyFooter({ ...rest }) {
    return (
        <Footer
            businessName='Landing Blocks'
            columns={{
                Developers: [
                    <MyLink href='#'>Components</MyLink>,
                    <MyLink href='#'>Components</MyLink>,
                    <MyLink href='#'>Components</MyLink>,
                ],
                Company: [<MyLink href='#'>Components</MyLink>],
                Product: [<MyLink href='#'>Components</MyLink>],
            }}
            {...rest}
        />
    )
}

export function MyLink({ href, ...rest }) {
    return (
        <NextLink href={href} passHref {...rest}>
            <Link
                fontWeight='medium'
                // color='black'
                // color={{ light: 'blue.400', dark: 'white' }[colorMode]}
                {...rest}
            />
        </NextLink>
    )
}