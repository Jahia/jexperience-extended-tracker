console.log('Loading jExperience extended tracker...');
const waitForWemInit = (maxWaitTime = 10000, checkInterval = 200) => {
    return new Promise((resolve, reject) => {
        // Check if wem.init is already available
        if (window.wem && typeof window.wem.init === 'function') {
            return resolve(window.wem);
        }

        const startTime = Date.now();
        const checkForWem = () => {
            // Check if max wait time has been exceeded
            if (Date.now() - startTime > maxWaitTime) {
                return reject(new Error('Timeout waiting for window.wem.init'));
            }

            // Check if wem.init is now available
            if (window.wem && typeof window.wem.init === 'function') {
                return resolve(window.wem);
            }

            // Try again after interval
            setTimeout(checkForWem, checkInterval);
        };

        // Start checking
        checkForWem();
    });
};

waitForWemInit()
    .then(() => {
        const oldWem = window.wem || {};
        window.wem = {
            ...oldWem,
            scrollDepthReached: {},
            pageViewStartTime: Date.now(),
            queue: [],
            batchSize: 10, // Number of events to batch before sending
            readDepthMarkers: {},
            contentVisibilitySelectors: ['.track-visibility', 'article', '.product', '.hero', '.cta'],
            downloadFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'exe', 'dmg'],
            trackEvent: (eventName, eventData, target) => {
                const buildEvent = window.wem.buildEvent(eventName,
                    target ? window.wem.buildTarget(target.id || target.className, target.tagName.toLowerCase()) : window.wem.buildTarget('page', 'body'),
                    window.wem.buildSourcePage());
                if (eventData) {
                    buildEvent.properties = buildEvent.properties || {};
                    Object.keys(eventData).forEach(key => {
                        buildEvent.properties[key] = eventData[key];
                    });
                }

                if (window.wem.queue) {
                    window.wem.queue.push(buildEvent);
                } else {
                    console.warn('jExperience tracker not initialized, event queued:', buildEvent);
                }

                // Process immediately if we've reached batch size
                if (window.wem.queue.length >= window.wem.batchSize) {
                    window.wem.processBatch();
                }
            },
            processBatch: () => {
                if (window.wem.queue && window.wem.queue.length > 0) {
                    const batch = window.wem.queue.splice(0, window.wem.batchSize);
                    // Send the batch to the server
                    window.wem.collectEvents({events: batch});
                }
            },
            initExtendedTracker: function () {
                // Put a marker to be able to know when wem is fully loaded, context is loaded, and callbacks have been executed.
                window.wem._registerCallback(() => {
                    window.wem._setupContentVisibilityTracking();
                    window.wem._detectScrollDepth(0.25, () => window.wem.trackEvent('scrollDepth', {depth: '25%'}));
                    window.wem._detectScrollDepth(0.50, () => window.wem.trackEvent('scrollDepth', {depth: '50%'}));
                    window.wem._detectScrollDepth(0.75, () => window.wem.trackEvent('scrollDepth', {depth: '75%'}));
                    window.wem._detectScrollDepth(0.90, () => window.wem.trackEvent('scrollDepth', {depth: '90%'}));
                    window.wem._setupReadDepthTracking();
                    window.wem._setupMediaInteractionTracking();
                    window.wem._setupDownloadTracking();
                    window.wem._setupCopyActionTracking();
                    setInterval(window.wem.processBatch, 3000); // Process events every 3 seconds
                    window.addEventListener('beforeunload', window.wem._trackTimeOnPage);
                }, 'jExperience extended tracker fully loaded', 121);
            },

            _trackTimeOnPage: () => {
                const timeSpent = Date.now() - window.wem.pageViewStartTime;
                window.wem.trackEvent('timeOnPage', {
                    milliseconds: timeSpent,
                    seconds: Math.floor(timeSpent / 1000)
                });
                window.wem.processBatch(); // Force processing before page unload
            },

            _setupContentVisibilityTracking: () => {
                // Create IntersectionObserver
                const visibilityObserver = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const element = entry.target;
                            window.wem.trackEvent('contentVisible', {}, element);
                            // Optionally stop observing after first visibility
                            visibilityObserver.unobserve(element);
                        }
                    });
                }, {
                    threshold: 0.5 // Element is considered visible when 50% is in viewport
                });

                // Start observing elements matching configured selectors
                window.wem.contentVisibilitySelectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(element => {
                        if (!element.dataset.wemObserved) {
                            visibilityObserver.observe(element);
                            element.dataset.wemObserved = 'true';
                        }
                    });
                });

                // Monitor for new elements
                const contentObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Element node
                                // Check if the node matches any selector
                                if (window.wem.contentVisibilitySelectors.some(selector =>
                                    node.matches && node.matches(selector))) {
                                    if (!node.dataset.wemObserved) {
                                        visibilityObserver.observe(node);
                                        node.dataset.wemObserved = 'true';
                                    }
                                }

                                // Check child nodes

                                window.wem.contentVisibilitySelectors.forEach(selector => {
                                    if (node.querySelectorAll) {
                                        node.querySelectorAll(selector).forEach(element => {
                                            if (!element.dataset.wemObserved) {
                                                visibilityObserver.observe(element);
                                                element.dataset.wemObserved = 'true';
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                });

                contentObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            },

            _detectScrollDepth: (threshold, callback) => {
                const checkScrollDepth = () => {
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
                    const scrollPercentage = scrollPosition / scrollHeight;

                    if (scrollPercentage >= threshold && !window.wem.scrollDepthReached[threshold]) {
                        window.wem.scrollDepthReached[threshold] = true;
                        callback();
                    }
                };

                window.addEventListener('scroll', checkScrollDepth, {passive: true});
                // Check initial scroll position
                checkScrollDepth();
            },
            _setupReadDepthTracking: () => {
                // Find main content element
                const contentElement = document.querySelector('article, .content, main') || document.body;
                const contentHeight = contentElement.scrollHeight;

                // Create read depth markers
                const markers = [0.2, 0.4, 0.6, 0.8, 1.0]; // 20%, 40%, 60%, 80%, 100%

                const trackReadPosition = () => {
                    // Calculate how far the user has scrolled in the content
                    const windowHeight = window.innerHeight;
                    const scrollTop = window.scrollY || document.documentElement.scrollTop;
                    const contentBox = contentElement.getBoundingClientRect();
                    const contentStart = scrollTop + contentBox.top;

                    // If we've scrolled past the content start
                    if (scrollTop >= contentStart) {
                        // Calculate how far through the content the user has read
                        const pixelsRead = Math.min(scrollTop + windowHeight - contentStart, contentHeight);
                        const percentageRead = pixelsRead / contentHeight;

                        // Check if we've passed any markers
                        markers.forEach(marker => {
                            if (percentageRead >= marker && !window.wem.readDepthMarkers[marker]) {
                                window.wem.readDepthMarkers[marker] = true;
                                window.wem.trackEvent('readDepth', {
                                    depth: `${Math.round(marker * 100)}%`
                                }, contentElement);
                            }
                        });
                    }
                };

                // Track read position on scroll
                window.addEventListener('scroll', trackReadPosition, {passive: true});

                // Check initial position
                trackReadPosition();
            },
            _setupMediaInteractionTracking: () => {
                // Find all video and audio elements
                const mediaElements = document.querySelectorAll('video, audio');

                // Function to add media tracking to an element
                const trackMediaElement = media => {
                    if (media.dataset.trackingInitialized) {
                        return;
                    }

                    const mediaSrc = media.currentSrc || media.src || null;
                    const mediaTitle = media.title || media.getAttribute('aria-label') || null;

                    // Progress markers
                    const progressMarkers = {25: false, 50: false, 75: false};

                    // Track play events
                    media.addEventListener('play', () => {
                        window.wem.trackEvent('mediaPlay', {
                            mediaSrc, mediaTitle,
                            currentTime: Math.round(media.currentTime)
                        }, media);
                    });

                    // Track pause events
                    media.addEventListener('pause', () => {
                        if (!media.ended) {
                            window.wem.trackEvent('mediaPause', {
                                mediaSrc, mediaTitle,
                                currentTime: Math.round(media.currentTime),
                                duration: Math.round(media.duration) || null
                            });
                        }
                    });

                    // Track completion
                    media.addEventListener('ended', () => {
                        window.wem.trackEvent('mediaComplete', {
                            mediaSrc, mediaTitle,
                            duration: Math.round(media.duration) || null
                        });
                    });

                    // Track progress
                    media.addEventListener('timeupdate', () => {
                        if (media.duration) {
                            const percent = Math.floor((media.currentTime / media.duration) * 100);

                            // Check progress markers
                            [25, 50, 75].forEach(marker => {
                                if (percent >= marker && !progressMarkers[marker]) {
                                    progressMarkers[marker] = true;
                                    window.wem.trackEvent('mediaProgress', {
                                        mediaSrc, mediaTitle,
                                        progress: `${marker}%`,
                                        currentTime: Math.round(media.currentTime),
                                        duration: Math.round(media.duration)
                                    });
                                }
                            });
                        }
                    });

                    // Mark as initialized
                    media.dataset.trackingInitialized = 'true';
                };

                // Track existing media elements
                mediaElements.forEach(trackMediaElement);

                // Observe for new media elements
                const mediaObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                if (['VIDEO', 'AUDIO'].includes(node.tagName)) {
                                    trackMediaElement(node);
                                }

                                if (node.querySelectorAll) {
                                    node.querySelectorAll('video, audio').forEach(trackMediaElement);
                                }
                            }
                        });
                    });
                });

                mediaObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            },
            _setupDownloadTracking: () => {
                // Function to check if a link is a download
                const isDownloadLink = link => {
                    // Check download attribute
                    if (link.hasAttribute('download')) {
                        return true;
                    }

                    // Check file extension
                    if (link.href) {
                        const url = link.href.toLowerCase();
                        return window.wem.downloadFileTypes.some(ext => url.endsWith('.' + ext));
                    }

                    return false;
                };

                // Function to track download
                const trackDownload = event => {
                    const link = event.currentTarget;
                    const filename = link.download || link.href.split('/').pop() || 'unknown';
                    const fileType = filename.split('.').pop() || 'unknown';

                    window.wem.trackEvent('download', {
                        filename,
                        fileType,
                        href: link.href,
                        linkText: link.innerText || link.textContent || null
                    }, link);
                };

                // Track existing download links
                document.querySelectorAll('a').forEach(link => {
                    if (isDownloadLink(link) && !link.dataset.downloadTracked) {
                        link.addEventListener('click', trackDownload);
                        link.dataset.downloadTracked = 'true';
                    }
                });

                // Observe for new download links
                const linkObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                if (node.tagName === 'A' && isDownloadLink(node) && !node.dataset.downloadTracked) {
                                    node.addEventListener('click', trackDownload);
                                    node.dataset.downloadTracked = 'true';
                                }

                                if (node.querySelectorAll) {
                                    node.querySelectorAll('a').forEach(link => {
                                        if (isDownloadLink(link) && !link.dataset.downloadTracked) {
                                            link.addEventListener('click', trackDownload);
                                            link.dataset.downloadTracked = 'true';
                                        }
                                    });
                                }
                            }
                        });
                    });
                });

                linkObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            },
            _setupCopyActionTracking: () => {
                document.addEventListener('copy', () => {
                    // Get selected text if available
                    const selectedText = window.getSelection()?.toString().substring(0, 2000) || '';

                    // Get context of what was copied
                    let copySource = 'body';

                    // Try to determine what element the selection is in
                    if (window.getSelection && window.getSelection().rangeCount > 0) {
                        const range = window.getSelection().getRangeAt(0);
                        const container = range.commonAncestorContainer;
                        const element = container.nodeType === 1 ? container : container.parentElement;

                        if (element) {
                            // Try to determine context
                            if (element.closest('article')) {
                                copySource = 'article';
                            } else if (element.closest('pre, code')) {
                                copySource = 'code';
                            } else if (element.closest('table')) {
                                copySource = 'table';
                            } else if (element.closest('p, h1, h2, h3, h4, h5, h6')) {
                                copySource = 'text';
                            }

                            window.wem.trackEvent('contentCopy', {
                                textLength: selectedText.length,
                                textPreview: selectedText.length > 0 ? selectedText : null,
                                copySource
                            }, element);
                        }
                    }
                });
            }
        };
        console.log('Loaded jExperience extended tracker...');
    }).catch(error => {
        console.error('Failed to initialize extended tracker:', error.message);
    });

