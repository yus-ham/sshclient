<script lang="ts">
    // Svelte 5: Callback props pattern
    let { connections = [], onadd, onconnect } = $props();

    function connect(conn) {
        console.log("[ConnectionList] Item tapped:", conn.name);
        if (onconnect) onconnect(conn);
    }

    function addConnection() {
        console.log("[ConnectionList] Add button tapped");
        if (onadd) onadd();
    }
</script>

<stackLayout class="p-20">
    <label text="Saved Connections" class="h2"></label>
    {#each connections as conn}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <gridLayout columns="*, auto" class="connection-item" ontap={() => connect(conn)}>
            <stackLayout col="0">
                <label text="{conn.name}" class="connection-name"></label>
                <label text="{conn.user}@{conn.host}" class="connection-details"></label>
            </stackLayout>
            <label col="1" class="fas" text="&#xf105;"></label>
        </gridLayout>
    {:else}
        <label text="No connections saved yet." class="p-10"></label>
    {/each}

    <button text="Add New Connection" class="btn-primary" ontap={addConnection}></button>
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