/*
In NativeScript, the app.ts file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first page.
*/

import '@nativescript/core/globals';
import '@nativescript/core/ui/frame/activity'; // Force activity registration
import '@nativescript/core/bundle-entry-points';
import { svelteNativeNoFrame } from '@nativescript-community/svelte-native'
import App from './App.svelte'

svelteNativeNoFrame(App, {})
