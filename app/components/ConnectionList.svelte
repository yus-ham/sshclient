<script lang="ts">
    // Svelte 5: Callback props pattern
    let { connections = [], onadd, onconnect } = $props();

    function connect(conn) {
        if (onconnect) onconnect(conn);
    }

    function addConnection() {
        if (onadd) onadd();
    }
</script>

<stackLayout class="p-20">
    <label text="Saved Connections" class="h2" />
    {#each connections as conn}
        <gridLayout columns="*, auto" class="connection-item" ontap={() => connect(conn)}>
            <stackLayout col="0">
                <label text="{conn.name}" class="connection-name" />
                <label text="{conn.user}@{conn.host}" class="connection-details" />
            </stackLayout>
            <label col="1" class="fas" text="&#xf105;" />
        </gridLayout>
    {:else}
        <label text="No connections saved yet." class="p-10" />
    {/each}

    <button text="Add New Connection" class="btn-primary" ontap={addConnection} />
</stackLayout>

<style>
    .connection-item {
        padding: 15;
        border-bottom-width: 1;
        border-bottom-color: #ccc;
    }
    .connection-name {
        font-size: 18;
        font-weight: bold;
    }
    .connection-details {
        font-size: 14;
        color: #666;
    }
    .btn-primary {
        margin-top: 20;
    }
</style>