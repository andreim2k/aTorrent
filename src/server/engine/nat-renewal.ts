import type WebTorrent from 'webtorrent';

/**
 * Work around a leak in @silentbot1/nat-api (WebTorrent's UPnP/NAT-PMP helper): every time it renews a
 * port mapping it starts a new renewal timer without clearing the previous one, so the number of timers
 * doubles each renewal period (~110 min) and every one of them runs SSDP discovery plus SOAP requests.
 * Over days that exhausts memory. We turn its auto-renewal off and renew the same mappings from a single
 * timer instead.
 */
export function renewNatMappingsOnce(c: WebTorrent.Instance): NodeJS.Timeout | null {
  const nat = (c as any).natTraversal;
  if (!nat || typeof nat.map !== 'function' || !Array.isArray(nat._openPorts)) return null;

  nat.autoUpdate = false;

  const timer = setInterval(async () => {
    if (nat._destroyed) return;
    const ports: any[] = nat._openPorts.splice(0);
    for (const port of ports) {
      let ok = false;
      try {
        ok = await nat.map(port);
      } catch {
        // gateway unreachable or client destroyed; retry next period
      }
      if (!ok) nat._openPorts.push(port);
    }
  }, nat._timeout ?? 6_600_000);
  timer.unref();
  return timer;
}
