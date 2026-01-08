<script lang="ts">
    import ConnectionList from './ConnectionList.svelte';
    import { ApplicationSettings, Utils } from '@nativescript/core';
    
    // Load from storage or use defaults
    const SAVED_KEY = 'ssh_connections';
    let savedData = ApplicationSettings.getString(SAVED_KEY);
    
    let connections = $state(savedData ? JSON.parse(savedData) : [
        { name: "My VPS", host: "vps.example.com", user: "admin" },
        { name: "Home Lab", host: "192.168.1.100", user: "pi" }
    ]);

    function save() {
        ApplicationSettings.setString(SAVED_KEY, JSON.stringify(connections));
        console.log("Connections saved to storage.");
    }

    function addNew() {
        console.log("Adding new dummy connection...");
        // Add dummy data for testing persistence
        connections = [...connections, { 
            name: "Server " + (connections.length + 1), 
            host: "10.0.0." + (connections.length + 1), 
            user: "root" 
        }];
        save();
    }

    function handleConnect(conn) {
        alert(`Connecting to ${conn.user}@${conn.host}...`);
    }

    function openLink(url) {
        console.log("Opening URL via Utils:", url);
        Utils.openUrl(url);
    }
</script>

<page>
    <actionBar title="SSH Client" />
    <stackLayout class="p-20">
        <ConnectionList {connections} onadd={addNew} onconnect={handleConnect} />
        
        <wrapLayout class="footer-container" orientation="horizontal" horizontalAlignment="center">
            <label text="built with ❤️  using " class="footer-text" />
            <label text="bun" class="link footer-text" ontap={() => openLink('https://bun.sh')} />
            <label text=" + " class="footer-text" />
            <label text="svelte-native" class="link footer-text" ontap={() => openLink('https://svelte.nativescript.org/')} />
        </wrapLayout>
    </stackLayout>
</page>

<style>
    .footer-container {
        margin-top: 40;
        padding: 10;
        text-align: center;
        justify-content: center; /* Web Flexbox */
    }
    .footer-text {
        font-size: 12;
        color: #999;
        font-style: italic;
        margin: 0;
        padding: 0;
    }
    .link {
        color: #3A53FF;
        text-decoration: underline;
        margin-left: 3;
        margin-right: 3;
    }
</style>
