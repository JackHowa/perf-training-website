(function (ready) {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    ready();
  } else {
    document.addEventListener("readystatechange", function () {
      if (document.readyState === "complete") {
        ready();
      }
    });
  }
})(function perf() { /* the document is now complete. */

  var data = {
    url: window.location.href,
    dcl: 0, // old world of performance
    load: 0,
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0
  };

  // first contentful paint observer
  var fcpObserver = new PerformanceObserver(function handleFCP(entryList) {
    var entries = entryList.getEntries() || [];
    entries.forEach(function (entry) {
      if (entry.name === "first-contentful-paint") {
        data.fcp = entry.startTime;
        console.log("Recorded FCP Performance: " + data.fcp);
      }
    });
  }).observe({ type: "paint", buffered: true }); // buffer may have already happened, getting historical events


  var lcpObserver = new PerformanceObserver(function handleLCP(entryList) {
    var entries = entryList.getEntries() || [];
    entries.forEach(function (entry) {
      // will fire every time there's the largest one
      // will not just happen once if there was not the logic to check if it was the largest
      if (entry.startTime > data.lcp) {
        data.lcp = entry.startTime;
        console.log("Recorded LCP Performance: " + data.lcp);
      }
    });
  }).observe({ type: "largest-contentful-paint", buffered: true });

  // cumulative layout shift
  var clsObserver = new PerformanceObserver(function handleCLS(entryList) {
    var entries = entryList.getEntries() || [];
    entries.forEach(function (entry) {
      // expected shift like maximize video
      if (!entry.hadRecentInput) {
        // every layout shift, this will be added to the cumulative shift
        data.cls += entry.value;
        console.log("Increased CLS Performance: " + data.cls);
      }
    });
  }).observe({ type: "layout-shift", buffered: true });

  // if no clicking, then no first input delay
  var fidObserver = new PerformanceObserver(function handleFID(entryList) {
    var entries = entryList.getEntries() || [];
    entries.forEach(function (entry) {
      data.fid = entry.processingStart - entry.startTime;
      console.log("Recorded FID Performance: " + data.fid);
    });
  }).observe({ type: "first-input", buffered: true });

  // wait for user to leave page
  // send beacon
  window.addEventListener("beforeunload", function () {
    var navEntry = performance.getEntriesByType("navigation")[0];
    data.dcl = navEntry.domContentLoadedEventStart;
    data.load = navEntry.loadEventStart;

    var payload = JSON.stringify(data);

    // sending back to server
    // very small payload in the beacon
    navigator.sendBeacon("/api/perf", payload);
    console.log("Sending performance:", payload);
  });

});
