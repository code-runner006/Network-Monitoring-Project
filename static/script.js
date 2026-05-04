var refreshInterval = null;


function startMonitoring() {
    fetch("/start", { method: "POST" })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            document.getElementById("startBtn").disabled = true;
            document.getElementById("stopBtn").disabled = false;
            refreshInterval = setInterval(fetchData, 2000);
        });
}


function stopMonitoring() {
    fetch("/stop", { method: "POST" })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            document.getElementById("startBtn").disabled = false;
            document.getElementById("stopBtn").disabled = true;
            clearInterval(refreshInterval);
            fetchData();
        });
}


function applyFilter() {
    fetchData();
}


function resetFilter() {
    document.getElementById("protocolFilter").value = "";
    document.getElementById("srcIpFilter").value = "";
    document.getElementById("dstIpFilter").value = "";
    fetchData();
}


function buildPacketURL() {
    var protocol = document.getElementById("protocolFilter").value;
    var srcIp = document.getElementById("srcIpFilter").value;
    var dstIp = document.getElementById("dstIpFilter").value;

    var url = "/packets?";

    if (protocol != "") {
        url = url + "protocol=" + protocol + "&";
    }
    if (srcIp != "") {
        url = url + "src_ip=" + srcIp + "&";
    }
    if (dstIp != "") {
        url = url + "dst_ip=" + dstIp + "&";
    }

    return url;
}


function fetchData() {
    var url = buildPacketURL();

    fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(packets) { updateTable(packets); });

    fetch("/stats")
        .then(function(res) { return res.json(); })
        .then(function(stats) { updateStats(stats); });
}


function updateTable(packets) {
    var tbody = document.getElementById("packetTableBody");

    if (packets.length == 1) {
        document.getElementById("packetCount").textContent = "1 packet";
    } else {
        document.getElementById("packetCount").textContent = packets.length + " packets";
    }

    if (packets.length == 0) {
        tbody.innerHTML = "<tr class='empty-row'><td colspan='9'><div class='empty-state'><span>No packets match the current filter</span></div></td></tr>";
        return;
    }

    tbody.innerHTML = "";

    for (var i = 0; i < packets.length; i++) {
        var p = packets[i];
        var proto = p.protocol.toLowerCase();

        var row = document.createElement("tr");

        var td1 = document.createElement("td");
        td1.textContent = i + 1;

        var td2 = document.createElement("td");
        td2.textContent = p.time;

        var td3 = document.createElement("td");
        td3.textContent = p.src_ip;

        var td4 = document.createElement("td");
        td4.textContent = p.dst_ip;

        var td5 = document.createElement("td");
        var badge = document.createElement("span");
        badge.className = "proto-badge " + proto;
        badge.textContent = p.protocol;
        td5.appendChild(badge);

        var td6 = document.createElement("td");
        td6.textContent = p.src_port;

        var td7 = document.createElement("td");
        td7.textContent = p.dst_port;

        var td8 = document.createElement("td");
        td8.textContent = p.service;

        var td9 = document.createElement("td");
        td9.textContent = p.size + " B";

        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        row.appendChild(td5);
        row.appendChild(td6);
        row.appendChild(td7);
        row.appendChild(td8);
        row.appendChild(td9);

        tbody.appendChild(row);
    }
}


function updateStats(stats) {
    document.getElementById("totalPackets").textContent = stats.total_packets;
    document.getElementById("tcpCount").textContent = stats.protocol_counts.TCP;
    document.getElementById("udpCount").textContent = stats.protocol_counts.UDP;
    document.getElementById("icmpCount").textContent = stats.protocol_counts.ICMP;
    document.getElementById("otherCount").textContent = stats.protocol_counts.OTHER;
    document.getElementById("avgSize").textContent = stats.avg_size + " B";
}


function openLogsPanel() {
    document.getElementById("logs-panel").style.display = "flex";
    fetch("/logs")
        .then(function(res) { return res.json(); })
        .then(function(records) { updateLogsTable(records); });
}


function closeLogsPanel() {
    document.getElementById("logs-panel").style.display = "none";
}


function updateLogsTable(records) {
    var tbody = document.getElementById("logsTableBody");

    if (records.length == 0) {
        tbody.innerHTML = "<tr class='empty-row'><td colspan='8'><div class='empty-state'>No records found</div></td></tr>";
        return;
    }

    tbody.innerHTML = "";

    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        var proto = r.protocol.toLowerCase();

        var row = document.createElement("tr");

        var td2 = document.createElement("td");
        td2.textContent = r.time;

        var td3 = document.createElement("td");
        td3.textContent = r.src_ip;

        var td4 = document.createElement("td");
        td4.textContent = r.dst_ip;

        var td5 = document.createElement("td");
        var badge = document.createElement("span");
        badge.className = "proto-badge " + proto;
        badge.textContent = r.protocol;
        td5.appendChild(badge);

        var td6 = document.createElement("td");
        td6.textContent = r.src_port;

        var td7 = document.createElement("td");
        td7.textContent = r.dst_port;

        var td8 = document.createElement("td");
        td8.textContent = r.service;

        var td9 = document.createElement("td");
        td9.textContent = r.size + " B";

        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        row.appendChild(td5);
        row.appendChild(td6);
        row.appendChild(td7);
        row.appendChild(td8);
        row.appendChild(td9);

        tbody.appendChild(row);
    }
}
