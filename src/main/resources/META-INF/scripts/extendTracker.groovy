
if (renderContext.getRequest().getParameterMap().containsKey("skipWem")) {
    return
}

htmlHeadContent.append("<jahia:resource type=\"javascript\" key=\"jexperience-extended-tracker\" path=\"" + renderContext.getRequest().getContextPath() + "/modules/jexperience-extended-tracker/javascript/jexperience/dist/1_0_0-SNAPSHOT/wem.min.js\" />\n")

// SCP Nonce security policy:
// The nonce have been generated using this: Base64.getEncoder().encodeToString(UUID.randomUUID().toString().getBytes(StandardCharsets.UTF_8))
tracker = """\
<script type="text/javascript" nonce="NmE5ZDg2NGEtNGU4Yy00NmIyLWFmMWYtOTQxNThjZDJiMDEw">    
   // Expose Wem init functions  
   wem.initExtendedTracker();
  </script>
"""

htmlHeadContent.append("<jahia:resource type=\"inlinejavascript\" key=\"jexperience-extended-tracker-init\" path=\"" + URLEncoder.encode(tracker, "UTF-8") + "\" />")
