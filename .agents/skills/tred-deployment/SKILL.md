---
name: tred-deployment
description: Use existing official Vercel deployment and verification skills only for explicitly scoped T-RED releases.
---

# tred-deployment

This adapter does not deploy. When the task actually includes release work, read the available official Vercel deployments-cicd / verification / protected-deployment skills as applicable. Keep the known project/team and Git source; do not create a replacement app, read secret values or change environment/persistence configuration as incidental setup.

Require the source checkpoint, selected test results and reviewed visual report before a release. A skill selection is not deployment authorization. For large runtime/engine/data changes, honor the user's report-before-implementation checkpoint. Preserve live main changes, use normal Git history and existing production infrastructure. Confirm the exact commit, target and READY aliases; distinguish those from successful HTTP/browser flows. Report tool access failures rather than bypassing protection or claiming an untested live flow.
