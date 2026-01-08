<script lang="ts">
    import ConnectionList from './ConnectionList.svelte';
    
    let connections = [
        { name: "My VPS", host: "vps.example.com", user: "admin" },
        { name: "Home Lab", host: "192.168.1.100", user: "pi" }
    ];

    function addNew() {
        console.log("Navigating to Add New Connection...");
    }

    function handleConnect(conn) {
        alert(`Connecting to ${conn.user}@${conn.host}...`);
    }
</script>

<page>
    <actionBar title="SSH Client" />
    <stackLayout>
        <!-- Svelte 5: Pass functions directly to props -->
        <ConnectionList {connections} onadd={addNew} onconnect={handleConnect} />
    </stackLayout>
</page>