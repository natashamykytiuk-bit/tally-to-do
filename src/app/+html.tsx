import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// The HTML shell for every page of the web build (web only; native apps ignore this file).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Tally</title>
        <meta name="description" content="To-dos and habits, with streaks." />
        <meta name="theme-color" content="#3354C4" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Stops the page itself scrolling on web so ScrollViews behave like native. */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'body{background:#F3F5F9}@media (prefers-color-scheme:dark){body{background:#141821}}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
