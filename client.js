window.__ModuleLoader__.load({
  id: 'dsh-skill-studio-codex',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;

    const NS = 'dsh-skill-studio-codex';
    const API = '/api/skill-studio-codex.';
    const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    const EN = {
      'nav.title': 'Skills',
      'page.title': 'Skills',
      'page.subtitle': 'Codex-compatible SKILL.md skills. Manage user and project scopes, then invoke one in chat with $name.',
      'page.new': 'New skill',
      'page.refresh': 'Refresh',
      'page.search': 'Search skills',
      'page.all': 'All',
      'page.codex': 'Codex',
      'page.dsh': 'DSH',
      'page.shared': 'Shared',
      'page.builtin': 'Built-in',
      'page.count': 'skills',
      'page.trash': 'Trash',
      'page.emptyTitle': 'No skills in this view',
      'page.emptyBody': 'Create a skill for your user directory, or add one to this project so teammates can reuse it.',
      'page.emptyAction': 'Create the first skill',
      'page.loadError': 'Could not load skills.',
      'page.retry': 'Try again',
      'page.loading': 'Loading skills…',
      'scope.user': 'User',
      'scope.project': 'Project',
      'scope.builtin': 'Built-in',
      'source.codex': 'Codex',
      'source.dsh': 'DSH',
      'source.agents': 'Shared',
      'source.builtin': 'Built-in',
      'source.custom': 'Custom',
      'source.runtime': 'Runtime',
      'badge.effective': 'Active',
      'badge.shadowed': 'Shadowed',
      'badge.readonly': 'Read-only',
      'badge.runtime': 'Runtime',
      'badge.invalid': 'Needs attention',
      'list.noDescription': 'No description yet',
      'list.duplicateHint': 'A higher-priority copy with this name is active.',
      'detail.emptyTitle': 'Pick a skill to inspect it',
      'detail.emptyBody': 'Read the instructions, tune what the model and you can invoke, or start a new skill from a template.',
      'detail.startCreate': 'Start with a template',
      'detail.name': 'Name',
      'detail.description': 'Description',
      'detail.when': 'When to use',
      'detail.path': 'SKILL.md',
      'detail.invocation': 'Invocation',
      'detail.modelTitle': 'Model can load it',
      'detail.modelHint': 'The skill appears in the agent catalog and can be loaded with the skill tool.',
      'detail.userTitle': 'You can invoke it',
      'detail.userHint': 'Type $name in chat to inject its instructions directly into the turn.',
      'detail.instructions': 'Instructions',
      'detail.edit': 'Edit',
      'detail.preview': 'Preview',
      'detail.save': 'Save changes',
      'detail.saving': 'Saving…',
      'detail.saved': 'Skill saved.',
      'detail.discard': 'Discard',
      'detail.duplicate': 'Duplicate',
      'detail.delete': 'Delete',
      'detail.readonly': 'Read-only skill',
      'detail.readonlyHint': 'Built-in and runtime skills can be inspected, then duplicated into a writable scope.',
      'detail.runtimeHint': 'This skill is registered in memory by a plugin, not stored as a SKILL.md file.',
      'detail.invalid': 'This skill file is missing a valid name or description. Fix it before the agent can use it.',
      'detail.shadowed': 'Shadowed by another copy',
      'detail.shadowedHint': 'A copy with the same name in a higher-priority scope is active. Edit or disable that copy to make this one effective.',
      'detail.duplicateCount': 'copies share this name',
      'detail.copyInvocation': 'Copy $name',
      'detail.copied': 'Invocation copied.',
      'detail.copyPath': 'Copy path',
      'detail.pathCopied': 'Path copied.',
      'detail.unsaved': 'Unsaved changes',
      'detail.unsavedHint': 'Save before switching skills.',
      'detail.defaultPrompt': 'Default prompt',
      'detail.metadata': 'Details',
      'detail.provider': 'Provider',
      'detail.scope': 'Scope',
      'detail.openFile': 'Open file location',
      'create.title': 'New skill',
      'create.subtitle': 'Create a Codex-compatible folder with a SKILL.md. Keep it focused; add references or scripts beside it when needed.',
      'create.name': 'Name',
      'create.nameHint': 'Lowercase kebab-case. This becomes the folder name and the $invocation.',
      'create.namePlaceholder': 'release-checklist',
      'create.description': 'Description',
      'create.descriptionHint': 'One or two sentences. The model uses this to decide when to load the skill.',
      'create.descriptionPlaceholder': 'Use when preparing a release, verifying the changelog, and checking the final build.',
      'create.when': 'When to use (optional)',
      'create.whenPlaceholder': 'Extra routing hints for the model.',
      'create.destination': 'Destination',
      'create.instructions': 'Instructions',
      'create.template': 'Start from',
      'create.templateBlank': 'Blank skill',
      'create.templateWorkflow': 'Task workflow',
      'create.templateReference': 'Reference notes',
      'create.cancel': 'Cancel',
      'create.submit': 'Create skill',
      'create.creating': 'Creating…',
      'create.nameRequired': 'Enter a name.',
      'create.nameInvalid': 'Use lowercase letters, numbers, and single hyphens.',
      'create.descRequired': 'Enter a description.',
      'create.exists': 'A skill with this name already exists in the selected destination.',
      'create.failed': 'Could not create the skill.',
      'delete.title': 'Delete skill?',
      'delete.body': 'The skill will move to .trash inside its scope. You can restore it from Trash.',
      'delete.cancel': 'Cancel',
      'delete.confirm': 'Move to Trash',
      'delete.deleting': 'Moving…',
      'delete.failed': 'Could not delete the skill.',
      'trash.title': 'Trash',
      'trash.subtitle': 'Deleted skills stay recoverable until you remove the .trash folder yourself.',
      'trash.empty': 'Nothing here. Deleted skills will appear in this list.',
      'trash.restore': 'Restore',
      'trash.restoring': 'Restoring…',
      'trash.deletedAt': 'Deleted',
      'trash.close': 'Close',
      'trash.failed': 'Could not restore the skill.',
      'trash.restored': 'Skill restored.',
      'toast.toggled': 'Invocation updated.',
      'toast.deleted': 'Skill moved to Trash.',
      'toast.created': 'Skill created.',
      'toast.copyFailed': 'Could not copy to the clipboard.',
      'unsaved.confirm': 'Discard unsaved changes?',
      'error.generic': 'Something went wrong.',
      'error.save': 'Could not save the skill.',
      'error.toggle': 'Could not update invocation.',
      'error.unknown': 'Unknown error',
      'template.blank': '# {{title}}\n\nUse this skill when …\n\n## Workflow\n\n1. Confirm the goal and the inputs you need.\n2. Do the work in small, verifiable steps.\n3. Report the result, the files changed, and any remaining risk.\n\n## References\n\nAdd `references/…`, `scripts/…`, or `assets/…` beside this file when the skill needs extra material. Keep this file focused on the decisions the model must make.\n',
      'template.workflow': '# {{title}}\n\n## When to use\n\nDescribe the trigger in one sentence.\n\n## Inputs\n\n- What the user should provide.\n- What you can discover yourself.\n\n## Workflow\n\n1. Inspect the relevant context before changing anything.\n2. Make the smallest complete change.\n3. Verify the result with the project’s own checks.\n\n## Output\n\n- What to report back.\n- Where the result lives.\n\n## Guardrails\n\n- Do not skip verification.\n- Ask only for decisions the user owns.\n',
      'template.reference': '# {{title}}\n\n## Overview\n\nExplain what this reference covers and when to consult it.\n\n## Key facts\n\n- Fact one.\n- Fact two.\n\n## Lookup order\n\n1. Start with the closest project source of truth.\n2. Then read the relevant reference file beside this skill.\n3. Prefer concrete examples over general advice.\n\n## Examples\n\nAdd short, copy-ready examples here.\n',
    };

    const ZH = {
      'nav.title': '技能',
      'page.title': '技能',
      'page.subtitle': '兼容 Codex 的 SKILL.md 技能。管理用户级与项目级技能，然后在对话中输入 $name 调用。',
      'page.new': '新建技能',
      'page.refresh': '刷新',
      'page.search': '搜索技能',
      'page.all': '全部',
      'page.codex': 'Codex',
      'page.dsh': 'DSH',
      'page.shared': '共享',
      'page.builtin': '内置',
      'page.count': '个技能',
      'page.trash': '回收站',
      'page.emptyTitle': '当前视图没有技能',
      'page.emptyBody': '在用户目录新建技能，或加入当前项目，让团队可以复用。',
      'page.emptyAction': '创建第一个技能',
      'page.loadError': '无法加载技能。',
      'page.retry': '重试',
      'page.loading': '正在加载技能…',
      'scope.user': '用户',
      'scope.project': '项目',
      'scope.builtin': '内置',
      'source.codex': 'Codex',
      'source.dsh': 'DSH',
      'source.agents': '共享',
      'source.builtin': '内置',
      'source.custom': '自定义',
      'source.runtime': '运行时',
      'badge.effective': '生效',
      'badge.shadowed': '被覆盖',
      'badge.readonly': '只读',
      'badge.runtime': '运行时',
      'badge.invalid': '需修复',
      'list.noDescription': '暂无描述',
      'list.duplicateHint': '存在同名的高优先级副本，当前生效的是那个副本。',
      'detail.emptyTitle': '选择一个技能查看详情',
      'detail.emptyBody': '阅读指令、调整模型或用户调用权限，或从模板开始创建新技能。',
      'detail.startCreate': '从模板开始',
      'detail.name': '名称',
      'detail.description': '描述',
      'detail.when': '何时使用',
      'detail.path': 'SKILL.md',
      'detail.invocation': '调用方式',
      'detail.modelTitle': '允许模型加载',
      'detail.modelHint': '技能会进入 Agent 目录，并可通过 skill 工具加载。',
      'detail.userTitle': '允许用户调用',
      'detail.userHint': '在对话中输入 $name，即可把技能指令直接注入当前回合。',
      'detail.instructions': '指令内容',
      'detail.edit': '编辑',
      'detail.preview': '预览',
      'detail.save': '保存修改',
      'detail.saving': '保存中…',
      'detail.saved': '技能已保存。',
      'detail.discard': '放弃修改',
      'detail.duplicate': '复制',
      'detail.delete': '删除',
      'detail.readonly': '只读技能',
      'detail.readonlyHint': '内置与运行时技能可以查看，也可以复制到可写范围后再编辑。',
      'detail.runtimeHint': '该技能由插件在内存中注册，并不是磁盘上的 SKILL.md 文件。',
      'detail.invalid': '该技能文件缺少有效名称或描述。修复后 Agent 才能使用。',
      'detail.shadowed': '被其他副本覆盖',
      'detail.shadowedHint': '更高优先级范围存在同名副本，当前生效的是那个副本。编辑或停用该副本后，这个副本才会生效。',
      'detail.duplicateCount': '个同名副本',
      'detail.copyInvocation': '复制 $name',
      'detail.copied': '调用方式已复制。',
      'detail.copyPath': '复制路径',
      'detail.pathCopied': '路径已复制。',
      'detail.unsaved': '有未保存的修改',
      'detail.unsavedHint': '切换技能前请先保存。',
      'detail.defaultPrompt': '默认提示词',
      'detail.metadata': '详情',
      'detail.provider': '提供方',
      'detail.scope': '范围',
      'detail.openFile': '打开文件位置',
      'create.title': '新建技能',
      'create.subtitle': '创建一个兼容 Codex 的文件夹与 SKILL.md。保持聚焦；需要时在旁边添加 references 或 scripts。',
      'create.name': '名称',
      'create.nameHint': '小写 kebab-case。它同时是文件夹名和 $调用名。',
      'create.namePlaceholder': 'release-checklist',
      'create.description': '描述',
      'create.descriptionHint': '一两句话，模型据此判断何时加载该技能。',
      'create.descriptionPlaceholder': '在准备发布、检查更新日志和最终构建时使用。',
      'create.when': '何时使用（可选）',
      'create.whenPlaceholder': '给模型的额外路由提示。',
      'create.destination': '保存位置',
      'create.instructions': '指令内容',
      'create.template': '起始模板',
      'create.templateBlank': '空白技能',
      'create.templateWorkflow': '任务流程',
      'create.templateReference': '参考资料',
      'create.cancel': '取消',
      'create.submit': '创建技能',
      'create.creating': '创建中…',
      'create.nameRequired': '请输入名称。',
      'create.nameInvalid': '只能使用小写字母、数字和单个连字符。',
      'create.descRequired': '请输入描述。',
      'create.exists': '所选位置已存在同名技能。',
      'create.failed': '创建技能失败。',
      'delete.title': '删除技能？',
      'delete.body': '技能会移动到所在范围的 .trash 目录，你可以从回收站恢复。',
      'delete.cancel': '取消',
      'delete.confirm': '移到回收站',
      'delete.deleting': '移动中…',
      'delete.failed': '删除技能失败。',
      'trash.title': '回收站',
      'trash.subtitle': '已删除的技能会保留到你自己清理 .trash 目录为止。',
      'trash.empty': '这里还是空的。删除的技能会出现在这里。',
      'trash.restore': '恢复',
      'trash.restoring': '恢复中…',
      'trash.deletedAt': '删除时间',
      'trash.close': '关闭',
      'trash.failed': '恢复技能失败。',
      'trash.restored': '技能已恢复。',
      'toast.toggled': '调用权限已更新。',
      'toast.deleted': '技能已移到回收站。',
      'toast.created': '技能已创建。',
      'toast.copyFailed': '无法复制到剪贴板。',
      'unsaved.confirm': '放弃未保存的修改？',
      'error.generic': '发生未知错误。',
      'error.save': '保存技能失败。',
      'error.toggle': '更新调用权限失败。',
      'error.unknown': '未知错误',
      'template.blank': '# {{title}}\n\n当……时使用此技能。\n\n## 工作流程\n\n1. 确认目标与所需输入。\n2. 以小而可验证的步骤完成工作。\n3. 报告结果、改动文件与剩余风险。\n\n## 参考资料\n\n需要额外材料时，在此文件旁添加 `references/…`、`scripts/…` 或 `assets/…`。让此文件聚焦于模型需要做出的判断。\n',
      'template.workflow': '# {{title}}\n\n## 何时使用\n\n用一句话描述触发条件。\n\n## 输入\n\n- 用户需要提供什么。\n- 你可以自行发现什么。\n\n## 工作流程\n\n1. 改动前先检查相关上下文。\n2. 做最小但完整的改动。\n3. 用项目自身的检查验证结果。\n\n## 输出\n\n- 需要回报什么。\n- 结果位于哪里。\n\n## 约束\n\n- 不要跳过验证。\n- 只询问真正由用户决定的事项。\n',
      'template.reference': '# {{title}}\n\n## 概览\n\n说明这份参考资料覆盖什么，以及何时查阅。\n\n## 关键事实\n\n- 事实一。\n- 事实二。\n\n## 查阅顺序\n\n1. 先看项目中最接近的事实来源。\n2. 再读此技能旁的相关参考文件。\n3. 优先使用具体示例，而不是泛泛建议。\n\n## 示例\n\n在这里放简短、可直接复用的示例。\n',
    };

    const CSS = `
.dsss-page{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#111);color:var(--dsw-alias-label-primary,#eee);font-family:inherit}
.dsss-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:26px 30px 18px;border-bottom:.5px solid var(--dsw-alias-border-l1,#333)}
.dsss-heading{min-width:0}
.dsss-title{margin:0;font-size:23px;line-height:30px;font-weight:660;letter-spacing:-.02em}
.dsss-subtitle{margin:7px 0 0;max-width:720px;color:var(--dsw-alias-label-secondary,#aaa);font-size:13px;line-height:20px}
.dsss-actions{display:flex;align-items:center;gap:8px;flex:none;padding-top:2px}
.dsss-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 30px;border-bottom:.5px solid var(--dsw-alias-border-l1,#333)}
.dsss-tabs{display:flex;align-items:center;gap:2px;padding:2px;background:var(--dsw-alias-bg-layer-1,#1a1a1a);border:.5px solid var(--dsw-alias-border-l1,#333);border-radius:9px}
.dsss-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#aaa);font:inherit;font-size:12px;line-height:18px;padding:5px 10px;border-radius:7px;cursor:pointer}
.dsss-tab:hover{color:var(--dsw-alias-label-primary,#eee)}
.dsss-tab[aria-selected=true]{background:var(--dsw-alias-bg-layer-2,#252525);color:var(--dsw-alias-label-primary,#eee);box-shadow:0 0 0 .5px var(--dsw-alias-border-l2,#444) inset}
.dsss-search{position:relative;flex:1 1 220px;min-width:160px;max-width:360px}
.dsss-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-secondary,#888);pointer-events:none}
.dsss-input,.dsss-select,.dsss-textarea{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l2,#444);background:var(--dsw-alias-bg-layer-1,#181818);color:var(--dsw-alias-label-primary,#eee);border-radius:8px;font:inherit;font-size:13px;line-height:20px;padding:7px 9px;outline:none}
.dsss-input:focus,.dsss-select:focus,.dsss-textarea:focus{border-color:var(--dsw-alias-brand-primary,#4f7cf6);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary,#4f7cf6)}
.dsss-search .dsss-input{width:100%;padding-left:31px}
.dsss-count{margin-left:auto;color:var(--dsw-alias-label-secondary,#999);font-size:12px;white-space:nowrap}
.dsss-body{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);flex:1;min-height:0}
.dsss-list{border-right:.5px solid var(--dsw-alias-border-l1,#333);overflow:auto;padding:10px;scrollbar-gutter:stable}
.dsss-row{display:flex;gap:10px;align-items:flex-start;width:100%;box-sizing:border-box;text-align:left;appearance:none;border:.5px solid transparent;background:transparent;color:inherit;font:inherit;padding:10px;border-radius:10px;cursor:pointer}
.dsss-row:hover{background:var(--dsw-alias-bg-layer-1,#181818)}
.dsss-row[aria-current=true]{background:var(--dsw-alias-bg-layer-2,#242424);border-color:var(--dsw-alias-border-l2,#444)}
.dsss-avatar{flex:none;width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;background:var(--dsw-alias-brand-primary,#4f7cf6);box-shadow:inset 0 0 0 .5px rgba(255,255,255,.18);overflow:hidden}
.dsss-row-main{min-width:0;flex:1}
.dsss-row-top{display:flex;align-items:center;gap:7px;min-width:0}
.dsss-row-name{font-size:13px;line-height:18px;font-weight:620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsss-row-desc{display:-webkit-box;color:var(--dsw-alias-label-secondary,#aaa);font-size:12px;line-height:17px;margin-top:3px;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.dsss-row-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:7px}
.dsss-chip{display:inline-flex;align-items:center;gap:4px;border:.5px solid var(--dsw-alias-border-l1,#3a3a3a);background:var(--dsw-alias-bg-layer-1,#1b1b1b);color:var(--dsw-alias-label-secondary,#aaa);border-radius:999px;padding:1px 7px;font-size:10px;line-height:15px;white-space:nowrap}
.dsss-chip[data-kind=warn]{color:var(--dsw-alias-state-warn-primary,#dfa84a);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#dfa84a) 45%,transparent)}
.dsss-chip[data-kind=error]{color:var(--dsw-alias-state-error-primary,#ef7272);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 45%,transparent)}
.dsss-chip[data-kind=ok]{color:var(--dsw-alias-state-success-primary,#51b976);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#51b976) 35%,transparent)}
.dsss-row-end{flex:none;display:flex;align-items:center;padding-top:3px}
.dsss-switch{position:relative;flex:none;width:34px;height:19px;padding:2px;border:.5px solid var(--dsw-alias-border-l2,#444);border-radius:999px;background:var(--dsw-alias-bg-layer-2,#2a2a2a);cursor:pointer;transition:background .15s,border-color .15s}
.dsss-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary,#4f7cf6);border-color:var(--dsw-alias-brand-primary,#4f7cf6)}
.dsss-switch:disabled{cursor:default;opacity:.45}
.dsss-switch-thumb{display:block;width:13px;height:13px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 0 2px rgba(0,0,0,.35)}
.dsss-switch[aria-checked=true] .dsss-switch-thumb{transform:translateX(15px)}
.dsss-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4f7cf6);outline-offset:2px}
.dsss-detail{min-width:0;overflow:auto;scrollbar-gutter:stable}
.dsss-detail-inner{max-width:900px;margin:0 auto;padding:26px 32px 60px}
.dsss-detail-head{display:flex;gap:14px;align-items:flex-start}
.dsss-detail-title{margin:0;font-size:21px;line-height:28px;font-weight:660;letter-spacing:-.015em;overflow-wrap:anywhere}
.dsss-detail-name{margin-top:3px;color:var(--dsw-alias-label-secondary,#999);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px}
.dsss-detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 20px}
.dsss-banner{border:.5px solid var(--dsw-alias-border-l2,#444);background:var(--dsw-alias-bg-layer-1,#191919);border-radius:10px;padding:10px 12px;margin:14px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#aaa)}
.dsss-banner[data-kind=warn]{border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#dfa84a) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#dfa84a) 9%,var(--dsw-alias-bg-layer-1,#191919))}
.dsss-banner[data-kind=error]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 9%,var(--dsw-alias-bg-layer-1,#191919))}
.dsss-section{margin-top:22px}
.dsss-section-title{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:12px;line-height:18px;font-weight:640;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-secondary,#999)}
.dsss-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dsss-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.dsss-label{font-size:12px;line-height:17px;font-weight:600;color:var(--dsw-alias-label-primary,#ddd)}
.dsss-hint{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#999)}
.dsss-error{font-size:11px;line-height:16px;color:var(--dsw-alias-state-error-primary,#ef7272)}
.dsss-textarea{resize:vertical;min-height:360px;line-height:21px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;tab-size:2;white-space:pre-wrap}
.dsss-editor-bar{display:flex;align-items:center;gap:4px;margin:0 0 8px}
.dsss-mini-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#999);font:inherit;font-size:12px;padding:5px 9px;border-radius:7px;cursor:pointer}
.dsss-mini-tab[aria-selected=true]{background:var(--dsw-alias-bg-layer-2,#262626);color:var(--dsw-alias-label-primary,#eee)}
.dsss-preview{border:.5px solid var(--dsw-alias-border-l2,#444);background:var(--dsw-alias-bg-layer-1,#181818);border-radius:9px;padding:20px 22px;min-height:360px;font-size:13.5px;line-height:1.65;overflow:auto}
.dsss-preview h1,.dsss-preview h2,.dsss-preview h3,.dsss-preview h4,.dsss-preview h5,.dsss-preview h6{margin:1.2em 0 .45em;line-height:1.3;letter-spacing:-.01em}
.dsss-preview h1{font-size:22px;margin-top:0}.dsss-preview h2{font-size:18px}.dsss-preview h3{font-size:15px}.dsss-preview h4,.dsss-preview h5,.dsss-preview h6{font-size:13px}
.dsss-preview p{margin:.55em 0}.dsss-preview ul,.dsss-preview ol{margin:.55em 0;padding-left:1.6em}.dsss-preview li{margin:.22em 0}
.dsss-preview blockquote{margin:.8em 0;padding:.3em 0 .3em 14px;border-left:2px solid var(--dsw-alias-border-l2,#444);color:var(--dsw-alias-label-secondary,#aaa)}
.dsss-preview code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.9em;background:var(--dsw-alias-bg-layer-2,#252525);border:.5px solid var(--dsw-alias-border-l1,#333);border-radius:5px;padding:.1em .35em}
.dsss-preview pre{margin:.8em 0;padding:12px 14px;overflow:auto;background:var(--dsw-alias-bg-base,#111);border:.5px solid var(--dsw-alias-border-l1,#333);border-radius:8px}
.dsss-preview pre code{padding:0;border:0;background:transparent;font-size:12px;line-height:1.55}
.dsss-preview a{color:var(--dsw-alias-brand-primary,#6f95ff);text-decoration:none}.dsss-preview a:hover{text-decoration:underline}
.dsss-preview hr{border:0;border-top:.5px solid var(--dsw-alias-border-l2,#444);margin:1.2em 0}
.dsss-switches{display:flex;flex-direction:column;gap:0;border:.5px solid var(--dsw-alias-border-l2,#444);border-radius:10px;overflow:hidden}
.dsss-switch-row{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:12px 14px;background:var(--dsw-alias-bg-layer-1,#181818)}
.dsss-switch-row+.dsss-switch-row{border-top:.5px solid var(--dsw-alias-border-l1,#333)}
.dsss-switch-copy{min-width:0}.dsss-switch-title{font-size:12.5px;font-weight:600;line-height:18px}.dsss-switch-hint{margin-top:2px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#999)}
.dsss-meta-list{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px 18px;margin:0;font-size:12px;line-height:18px}
.dsss-meta-list dt{color:var(--dsw-alias-label-secondary,#999)}.dsss-meta-list dd{margin:0;overflow-wrap:anywhere}
.dsss-mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px}
.dsss-path{display:flex;align-items:center;gap:8px;min-width:0}
.dsss-path code{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary,#aaa)}
.dsss-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:.5px solid var(--dsw-alias-border-l2,#444);background:var(--dsw-alias-bg-layer-1,#1b1b1b);color:var(--dsw-alias-label-primary,#eee);border-radius:8px;padding:6px 11px;font:inherit;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap;transition:background .12s,border-color .12s,opacity .12s}
.dsss-btn:hover{background:var(--dsw-alias-bg-layer-2,#252525);border-color:var(--dsw-alias-border-l3,#555)}
.dsss-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4f7cf6);outline-offset:2px}
.dsss-btn:disabled{opacity:.45;cursor:default}
.dsss-btn[data-variant=primary]{background:var(--dsw-alias-brand-primary,#4f7cf6);border-color:var(--dsw-alias-brand-primary,#4f7cf6);color:#fff}
.dsss-btn[data-variant=primary]:hover{filter:brightness(1.06)}
.dsss-btn[data-variant=ghost]{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary,#aaa)}
.dsss-btn[data-variant=ghost]:hover{background:var(--dsw-alias-bg-layer-1,#1b1b1b);color:var(--dsw-alias-label-primary,#eee)}
.dsss-btn[data-variant=danger]{color:var(--dsw-alias-state-error-primary,#ef7272);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 40%,transparent)}
.dsss-btn[data-variant=danger]:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 10%,transparent)}
.dsss-icon-btn{width:29px;height:29px;padding:0}
.dsss-empty-page{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px}
.dsss-empty-icon{width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-1,#1a1a1a);border:.5px solid var(--dsw-alias-border-l2,#444);color:var(--dsw-alias-label-secondary,#999);margin-bottom:16px}
.dsss-empty-title{font-size:16px;font-weight:650;margin:0 0 7px}
.dsss-empty-body{max-width:440px;margin:0 0 17px;color:var(--dsw-alias-label-secondary,#999);font-size:12.5px;line-height:19px}
.dsss-detail-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%;padding:50px}
.dsss-modal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.52);display:flex;align-items:center;justify-content:center;padding:26px;backdrop-filter:blur(2px)}
.dsss-modal{width:min(660px,100%);max-height:min(86vh,900px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1,#181818);border:.5px solid var(--dsw-alias-border-l2,#444);border-radius:16px;box-shadow:0 22px 70px rgba(0,0,0,.5);overflow:hidden}
.dsss-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px 12px}
.dsss-modal-title{margin:0;font-size:17px;line-height:24px;font-weight:650}
.dsss-modal-sub{margin:4px 0 0;color:var(--dsw-alias-label-secondary,#999);font-size:12px;line-height:18px}
.dsss-modal-body{padding:6px 22px 20px;overflow:auto;min-height:0}
.dsss-modal-foot{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:14px 22px;border-top:.5px solid var(--dsw-alias-border-l1,#333);background:var(--dsw-alias-bg-layer-1,#181818)}
.dsss-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:1200;display:flex;align-items:center;gap:8px;max-width:min(560px,calc(100vw - 40px));padding:9px 13px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l2,#444);background:var(--dsw-alias-bg-overlay,#222);color:var(--dsw-alias-label-primary,#eee);box-shadow:0 10px 38px rgba(0,0,0,.4);font-size:12px;line-height:18px}
.dsss-toast[data-kind=error]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 50%,transparent)}
.dsss-spinner{width:13px;height:13px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:dsss-spin .75s linear infinite}
@keyframes dsss-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.dsss-spinner{animation:none}}
.dsss-loading{display:flex;align-items:center;justify-content:center;gap:9px;flex:1;color:var(--dsw-alias-label-secondary,#999);font-size:12px}
.dsss-error-box{max-width:560px;margin:50px auto;padding:20px;border:.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ef7272) 8%,var(--dsw-alias-bg-layer-1,#181818));border-radius:12px}
.dsss-error-box h2{margin:0 0 6px;font-size:15px}.dsss-error-box p{margin:0 0 14px;color:var(--dsw-alias-label-secondary,#aaa);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.dsss-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (max-width:980px){.dsss-body{grid-template-columns:1fr}.dsss-list{border-right:0;border-bottom:.5px solid var(--dsw-alias-border-l1,#333);max-height:40vh}.dsss-detail-inner{padding:22px 20px 50px}.dsss-header{padding:20px 20px 15px}.dsss-toolbar{padding:12px 20px}}
@media (max-width:640px){.dsss-grid{grid-template-columns:1fr}.dsss-actions{flex-wrap:wrap;justify-content:flex-end}.dsss-count{display:none}.dsss-detail-head{flex-wrap:wrap}}
`;

    class ApiError extends Error {}

    async function api(path, options = {}) {
      let response;
      try {
        response = await fetch(API + path, {
          cache: 'no-store',
          credentials: 'same-origin',
          ...options,
          headers: {
            ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
            ...(options.headers ?? {}),
          },
        });
      } catch (error) {
        throw new ApiError(error instanceof Error ? error.message : String(error));
      }
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new ApiError(text || `HTTP ${response.status}`);
      }
      if (!response.ok || data.ok === false) {
        throw new ApiError(data.error || `HTTP ${response.status}`);
      }
      return data;
    }

    function itemKey(item) {
      if (item.path) return `path:${item.path}`;
      return `${item.source}:${item.scope}:${item.name}`;
    }

    function humanTitle(name) {
      return String(name || 'Skill')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    function templateFor(kind, name, t) {
      const key = kind === 'workflow' ? 'template.workflow' : kind === 'reference' ? 'template.reference' : 'template.blank';
      return t(key).replaceAll('{{title}}', humanTitle(name || 'skill'));
    }

    function useLocale(ctx) {
      const [, setRevision] = useState(0);
      useEffect(() => {
        return ctx.locale.subscribe(() => setRevision((value) => value + 1));
      }, [ctx]);
      return ctx.locale.bind(NS);
    }

    function useStudio() {
      const [state, setState] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const reload = useCallback(async () => {
        setLoading(true);
        try {
          const data = await api('state');
          setState(data);
          setError(null);
          return data;
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
          return null;
        } finally {
          setLoading(false);
        }
      }, []);
      useEffect(() => {
        void reload();
      }, [reload]);
      return { state, setState, loading, error, reload };
    }

    function useModalEscape(onClose, active) {
      useEffect(() => {
        if (!active) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
      }, [active, onClose]);
    }

    function Icon({ name, size = 16 }) {
      const paths = {
        plus: 'M12 5v14M5 12h14',
        refresh: 'M20 7v5h-5M4 17v-5h5M6.1 9a7 7 0 0 1 11.3-2.4L20 9M4 15l2.6 2.4A7 7 0 0 0 17.9 15',
        search: 'm20 20-4.2-4.2M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
        close: 'M6 6l12 12M18 6 6 18',
        trash: 'M4 7h16M9 7V5h6v2M7 7l.8 13h8.4L17 7M10 11v5M14 11v5',
        copy: 'M9 9h10v11H9zM5 15V4h10',
        check: 'm5 12 4.2 4.2L19 6.5',
        chevron: 'm9 6 6 6-6 6',
        spark: 'M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z',
      };
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: paths[name] ?? paths.spark }),
      );
    }

    function SkillNavIcon({ size = 20 }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.65,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M5.5 4.5h8.2L18.5 9v10.5h-13z' }),
        h('path', { d: 'M13.5 4.8V9h4.4' }),
        h('path', { d: 'M8.4 13.2h6.2M8.4 16.2h4.3' }),
        h('path', { d: 'M18.7 3.2v3M17.2 4.7h3' }),
      );
    }

    function Avatar({ item, size = 32 }) {
      const color = item.interface?.brandColor;
      const letter = (item.displayName || item.name || '?').trim().charAt(0).toUpperCase() || '?';
      return h(
        'span',
        {
          className: 'dsss-avatar',
          style: {
            width: size,
            height: size,
            background: color || undefined,
            fontSize: Math.max(11, Math.round(size * 0.4)),
          },
          'aria-hidden': true,
        },
        letter,
      );
    }

    function Chip({ children, kind }) {
      return h('span', { className: 'dsss-chip', 'data-kind': kind }, children);
    }

    function Switch({ checked, disabled, onChange, label }) {
      return h(
        'button',
        {
          type: 'button',
          className: 'dsss-switch',
          role: 'switch',
          'aria-checked': checked,
          'aria-label': label,
          disabled,
          onClick: (event) => {
            event.stopPropagation();
            onChange(!checked);
          },
        },
        h('span', { className: 'dsss-switch-thumb' }),
      );
    }

    function renderInline(text, keyPrefix) {
      const nodes = [];
      const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/gu;
      let last = 0;
      let index = 0;
      for (const match of text.matchAll(pattern)) {
        if (match.index > last) nodes.push(text.slice(last, match.index));
        const token = match[0];
        const key = `${keyPrefix}-${index++}`;
        if (token.startsWith('`')) {
          nodes.push(h('code', { key }, token.slice(1, -1)));
        } else if (token.startsWith('**')) {
          nodes.push(h('strong', { key }, token.slice(2, -2)));
        } else if (token.startsWith('*')) {
          nodes.push(h('em', { key }, token.slice(1, -1)));
        } else {
          const link = /^\[([^\]]+)\]\(([^)]+)\)$/u.exec(token);
          if (link) {
            const href = link[2];
            const safe = /^(https?:|mailto:|#|\/)/iu.test(href);
            nodes.push(
              safe
                ? h('a', { key, href, target: href.startsWith('#') ? undefined : '_blank', rel: 'noreferrer' }, link[1])
                : h('span', { key }, link[1]),
            );
          } else {
            nodes.push(token);
          }
        }
        last = match.index + token.length;
      }
      if (last < text.length) nodes.push(text.slice(last));
      return nodes;
    }

    function Markdown({ text }) {
      const blocks = [];
      const lines = String(text ?? '').replace(/\r\n?/gu, '\n').split('\n');
      let index = 0;
      let key = 0;
      const nextKey = () => `md-${key++}`;
      const isBlockStart = (line) =>
        /^(#{1,6})\s+/u.test(line) ||
        /^```/u.test(line) ||
        /^\s*>\s?/u.test(line) ||
        /^\s*([-*+]|\d+\.)\s+/u.test(line) ||
        /^\s*---+\s*$/u.test(line);

      while (index < lines.length) {
        const line = lines[index];
        if (!line.trim()) {
          index += 1;
          continue;
        }
        const fence = /^```\s*([^\s`]*)\s*$/u.exec(line);
        if (fence) {
          index += 1;
          const code = [];
          while (index < lines.length && !/^```/u.test(lines[index])) {
            code.push(lines[index]);
            index += 1;
          }
          if (index < lines.length) index += 1;
          blocks.push(
            h('pre', { key: nextKey() }, h('code', fence[1] ? { 'data-lang': fence[1] } : null, code.join('\n'))),
          );
          continue;
        }
        const heading = /^(#{1,6})\s+(.*)$/u.exec(line);
        if (heading) {
          const level = Math.min(6, heading[1].length);
          blocks.push(h(`h${level}`, { key: nextKey() }, renderInline(heading[2], nextKey())));
          index += 1;
          continue;
        }
        if (/^\s*---+\s*$/u.test(line)) {
          blocks.push(h('hr', { key: nextKey() }));
          index += 1;
          continue;
        }
        if (/^\s*>\s?/u.test(line)) {
          const quote = [];
          while (index < lines.length && /^\s*>\s?/u.test(lines[index])) {
            quote.push(lines[index].replace(/^\s*>\s?/u, ''));
            index += 1;
          }
          blocks.push(h('blockquote', { key: nextKey() }, h('p', null, renderInline(quote.join(' '), nextKey()))));
          continue;
        }
        if (/^\s*([-*+]|\d+\.)\s+/u.test(line)) {
          const ordered = /^\s*\d+\.\s+/u.test(line);
          const items = [];
          while (index < lines.length && /^\s*([-*+]|\d+\.)\s+/u.test(lines[index])) {
            items.push(lines[index].replace(/^\s*(?:[-*+]|\d+\.)\s+/u, ''));
            index += 1;
            while (index < lines.length && /^\s{2,}\S/u.test(lines[index]) && !isBlockStart(lines[index])) {
              items[items.length - 1] += ` ${lines[index].trim()}`;
              index += 1;
            }
          }
          blocks.push(
            h(
              ordered ? 'ol' : 'ul',
              { key: nextKey() },
              items.map((item, itemIndex) => h('li', { key: `${nextKey()}-${itemIndex}` }, renderInline(item, nextKey()))),
            ),
          );
          continue;
        }
        const paragraph = [line];
        index += 1;
        while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
          paragraph.push(lines[index]);
          index += 1;
        }
        blocks.push(h('p', { key: nextKey() }, renderInline(paragraph.join(' '), nextKey())));
      }
      return h('div', { className: 'dsss-preview' }, blocks.length ? blocks : h('p', null, '—'));
    }

    function Modal({ title, subtitle, onClose, children, footer, wide }) {
      useModalEscape(onClose, true);
      return h(
        'div',
        {
          className: 'dsss-modal-overlay',
          role: 'presentation',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          {
            className: 'dsss-modal',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': title,
            style: wide ? { width: 'min(760px,100%)' } : undefined,
          },
          h(
            'div',
            { className: 'dsss-modal-head' },
            h('div', null, h('h2', { className: 'dsss-modal-title' }, title), subtitle ? h('p', { className: 'dsss-modal-sub' }, subtitle) : null),
            h(
              'button',
              {
                type: 'button',
                className: 'dsss-btn dsss-btn dsss-icon-btn',
                'data-variant': 'ghost',
                'aria-label': 'Close',
                onClick: onClose,
              },
              h(Icon, { name: 'close', size: 15 }),
            ),
          ),
          h('div', { className: 'dsss-modal-body' }, children),
          footer ? h('div', { className: 'dsss-modal-foot' }, footer) : null,
        ),
      );
    }

    function ConfirmDialog({ title, body, confirmLabel, cancelLabel, busy, danger, onCancel, onConfirm }) {
      return h(
        Modal,
        {
          title,
          onClose: busy ? () => {} : onCancel,
          footer: [
            h('button', { key: 'cancel', type: 'button', className: 'dsss-btn', onClick: onCancel, disabled: busy }, cancelLabel),
            h(
              'button',
              {
                key: 'confirm',
                type: 'button',
                className: 'dsss-btn',
                'data-variant': danger ? 'danger' : 'primary',
                onClick: onConfirm,
                disabled: busy,
              },
              busy ? h('span', { className: 'dsss-spinner' }) : null,
              confirmLabel,
            ),
          ],
        },
        h('p', { style: { margin: '2px 0 6px', fontSize: '13px', lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' } }, body),
      );
    }

    function CreateDialog({ open, roots, skills, initialRootId, duplicate, t, onClose, onCreate }) {
      const [name, setName] = useState('');
      const [description, setDescription] = useState('');
      const [whenToUse, setWhenToUse] = useState('');
      const [rootId, setRootId] = useState(initialRootId);
      const [template, setTemplate] = useState('blank');
      const [content, setContent] = useState('');
      const [submitted, setSubmitted] = useState(false);
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);
      const nameRef = useRef(null);

      useEffect(() => {
        if (!open) return;
        const firstRoot = roots.find((root) => root.id === initialRootId)?.id ?? roots.find((root) => root.id === 'codex-user')?.id ?? roots[0]?.id ?? '';
        const source = duplicate?.source;
        setName(duplicate?.name ?? '');
        setDescription(source?.description ?? '');
        setWhenToUse(source?.whenToUse ?? '');
        setRootId(firstRoot);
        setTemplate('blank');
        setContent(source?.content ?? templateFor('blank', 'skill', t));
        setSubmitted(false);
        setBusy(false);
        setError(null);
        const timer = setTimeout(() => nameRef.current?.focus(), 30);
        return () => clearTimeout(timer);
      }, [open, initialRootId, roots, t, duplicate?.name, duplicate?.source]);

      if (!open) return null;

      const selectedRoot = roots.find((root) => root.id === rootId);
      const nameError = !name.trim()
        ? t('create.nameRequired')
        : !NAME_RE.test(name.trim())
          ? t('create.nameInvalid')
          : null;
      const descriptionError = !description.trim() ? t('create.descRequired') : null;
      const exists = Boolean(
        selectedRoot &&
          skills.some(
            (skill) => skill.rootId === selectedRoot.id && skill.name === name.trim() && skill.scope !== 'builtin',
          ),
      );
      const submit = async () => {
        setSubmitted(true);
        setError(null);
        if (nameError || descriptionError || exists) return;
        setBusy(true);
        try {
          await onCreate({
            name: name.trim(),
            description: description.trim(),
            whenToUse: whenToUse.trim(),
            content,
            rootId,
            modelInvocable: true,
            userInvocable: true,
          });
          onClose();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setBusy(false);
        }
      };
      const changeTemplate = (value) => {
        setTemplate(value);
        setContent(templateFor(value, name || 'skill', t));
      };
      return h(
        Modal,
        {
          title: t('create.title'),
          subtitle: t('create.subtitle'),
          onClose: busy ? () => {} : onClose,
          wide: true,
          footer: [
            h('button', { key: 'cancel', type: 'button', className: 'dsss-btn', onClick: onClose, disabled: busy }, t('create.cancel')),
            h(
              'button',
              { key: 'create', type: 'button', className: 'dsss-btn', 'data-variant': 'primary', onClick: submit, disabled: busy },
              busy ? h('span', { className: 'dsss-spinner' }) : h(Icon, { name: 'plus', size: 14 }),
              busy ? t('create.creating') : t('create.submit'),
            ),
          ],
        },
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
          h(
            'div',
            { className: 'dsss-grid' },
            h(
              'div',
              { className: 'dsss-field' },
              h('label', { className: 'dsss-label', htmlFor: 'dsss-create-name' }, t('create.name')),
              h('input', {
                id: 'dsss-create-name',
                ref: nameRef,
                className: 'dsss-input',
                value: name,
                placeholder: t('create.namePlaceholder'),
                spellCheck: false,
                onChange: (event) => {
                  const value = event.target.value;
                  setName(value);
                  if (content === templateFor(template, name || 'skill', t)) {
                    setContent(templateFor(template, value || 'skill', t));
                  }
                },
              }),
              h('span', { className: 'dsss-hint' }, t('create.nameHint')),
              submitted && nameError ? h('span', { className: 'dsss-error' }, nameError) : null,
              submitted && exists ? h('span', { className: 'dsss-error' }, t('create.exists')) : null,
            ),
            h(
              'div',
              { className: 'dsss-field' },
              h('label', { className: 'dsss-label', htmlFor: 'dsss-create-root' }, t('create.destination')),
              h(
                'select',
                {
                  id: 'dsss-create-root',
                  className: 'dsss-select',
                  value: rootId,
                  onChange: (event) => setRootId(event.target.value),
                },
                roots.map((root) =>
                  h('option', { key: root.id, value: root.id }, `${t(`source.${root.source}`)} · ${t(`scope.${root.scope}`)} — ${root.displayPath}`),
                ),
              ),
              selectedRoot ? h('span', { className: 'dsss-hint dsss-mono' }, selectedRoot.displayPath) : null,
            ),
          ),
          h(
            'div',
            { className: 'dsss-field' },
            h('label', { className: 'dsss-label', htmlFor: 'dsss-create-description' }, t('create.description')),
            h('textarea', {
              id: 'dsss-create-description',
              className: 'dsss-textarea',
              style: { minHeight: '74px', fontFamily: 'inherit', fontSize: '13px' },
              value: description,
              placeholder: t('create.descriptionPlaceholder'),
              onChange: (event) => setDescription(event.target.value),
            }),
            h('span', { className: 'dsss-hint' }, t('create.descriptionHint')),
            submitted && descriptionError ? h('span', { className: 'dsss-error' }, descriptionError) : null,
          ),
          h(
            'div',
            { className: 'dsss-field' },
            h('label', { className: 'dsss-label', htmlFor: 'dsss-create-when' }, t('create.when')),
            h('input', {
              id: 'dsss-create-when',
              className: 'dsss-input',
              value: whenToUse,
              placeholder: t('create.whenPlaceholder'),
              onChange: (event) => setWhenToUse(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'dsss-field' },
            h('label', { className: 'dsss-label', htmlFor: 'dsss-create-template' }, t('create.template')),
            h(
              'select',
              {
                id: 'dsss-create-template',
                className: 'dsss-select',
                value: template,
                onChange: (event) => changeTemplate(event.target.value),
              },
              h('option', { value: 'blank' }, t('create.templateBlank')),
              h('option', { value: 'workflow' }, t('create.templateWorkflow')),
              h('option', { value: 'reference' }, t('create.templateReference')),
            ),
          ),
          h(
            'div',
            { className: 'dsss-field' },
            h('label', { className: 'dsss-label', htmlFor: 'dsss-create-content' }, t('create.instructions')),
            h('textarea', {
              id: 'dsss-create-content',
              className: 'dsss-textarea',
              style: { minHeight: '260px' },
              value: content,
              onChange: (event) => setContent(event.target.value),
            }),
          ),
          error ? h('div', { className: 'dsss-banner', 'data-kind': 'error' }, error) : null,
        ),
      );
    }

    function TrashDialog({ open, entries, busyPath, t, onClose, onRestore }) {
      if (!open) return null;
      return h(
        Modal,
        {
          title: t('trash.title'),
          subtitle: t('trash.subtitle'),
          onClose,
          footer: h('button', { type: 'button', className: 'dsss-btn', onClick: onClose }, t('trash.close')),
        },
        entries.length === 0
          ? h('div', { className: 'dsss-empty-body', style: { padding: '18px 0' } }, t('trash.empty'))
          : h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
              entries.map((entry) =>
                h(
                  'div',
                  {
                    key: entry.trashPath,
                    style: {
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '11px 12px',
                      border: '.5px solid var(--dsw-alias-border-l1, #333)',
                      borderRadius: '9px',
                      background: 'var(--dsw-alias-bg-layer-2, #222)',
                    },
                  },
                  h(
                    'div',
                    { style: { minWidth: 0 } },
                    h('div', { style: { fontSize: '12.5px', fontWeight: 620 } }, entry.displayName || entry.name),
                    h(
                      'div',
                      { className: 'dsss-hint', style: { marginTop: '2px', overflowWrap: 'anywhere' } },
                      entry.description || t('list.noDescription'),
                    ),
                    h(
                      'div',
                      { className: 'dsss-hint dsss-mono', style: { marginTop: '4px' } },
                      `${t('source.' + entry.source)} · ${t('scope.' + entry.scope)}${entry.deletedAt ? ` · ${t('trash.deletedAt')} ${entry.deletedAt.slice(0, 16).replace('T', ' ')}` : ''}`,
                    ),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsss-btn',
                      disabled: busyPath === entry.trashPath,
                      onClick: () => onRestore(entry),
                    },
                    busyPath === entry.trashPath ? h('span', { className: 'dsss-spinner' }) : h(Icon, { name: 'refresh', size: 13 }),
                    t('trash.restore'),
                  ),
                ),
              ),
            ),
      );
    }

    function SkillRow({ item, selected, busy, t, onSelect, onToggle }) {
      const source = item.sourceKind === 'builtin' ? 'builtin' : item.sourceKind;
      const enabled = item.invocation.modelInvocable && item.invocation.userInvocable;
      return h(
        'div',
        {
          className: 'dsss-row',
          role: 'group',
          tabIndex: 0,
          'aria-current': selected ? 'true' : undefined,
          onClick: () => onSelect(item),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(item);
            }
          },
        },
        h(Avatar, { item, size: 32 }),
        h(
          'div',
          { className: 'dsss-row-main' },
          h(
            'div',
            { className: 'dsss-row-top' },
            h('span', { className: 'dsss-row-name' }, item.displayName || item.name),
            item.shadowed ? h(Chip, { kind: 'warn' }, t('badge.shadowed')) : null,
            !item.valid ? h(Chip, { kind: 'error' }, t('badge.invalid')) : null,
          ),
          h('div', { className: 'dsss-row-desc' }, item.interface?.shortDescription || item.description || t('list.noDescription')),
          h(
            'div',
            { className: 'dsss-row-meta' },
            h(Chip, null, t(`source.${source}`)),
            h(Chip, null, t(`scope.${item.scope}`)),
            !item.editable ? h(Chip, null, t('badge.readonly')) : null,
            item.duplicateCount > 1 ? h(Chip, { kind: 'warn' }, `${item.duplicateCount} ${t('detail.duplicateCount')}`) : null,
          ),
        ),
        h(
          'div',
          { className: 'dsss-row-end' },
          h(Switch, {
            checked: enabled,
            disabled: !item.editable || busy,
            label: t('detail.modelTitle'),
            onChange: (next) => onToggle(item, { modelInvocable: next, userInvocable: next }),
          }),
        ),
      );
    }

    function DetailPane({ selected, detail, draft, setDraft, loading, error, busy, t, onSave, onDelete, onDuplicate, onToggle, onNotify, onRetry }) {
      const [mode, setMode] = useState('edit');
      useEffect(() => {
        setMode('edit');
      }, [selected ? itemKey(selected) : null]);
      if (!selected) {
        return h(
          'div',
          { className: 'dsss-detail-empty' },
          h('div', { className: 'dsss-empty-icon' }, h(Icon, { name: 'spark', size: 24 })),
          h('h2', { className: 'dsss-empty-title' }, t('detail.emptyTitle')),
          h('p', { className: 'dsss-empty-body' }, t('detail.emptyBody')),
        );
      }
      if (loading) {
        return h('div', { className: 'dsss-loading' }, h('span', { className: 'dsss-spinner' }), t('page.loading'));
      }
      if (!detail || !draft) {
        return h(
          'div',
          { className: 'dsss-error-box' },
          h('h2', null, t('page.loadError')),
          h('p', null, error || t('error.generic')),
          h('button', { type: 'button', className: 'dsss-btn', 'data-variant': 'primary', onClick: onRetry }, t('page.retry')),
        );
      }
      const skill = detail.skill;
      const readOnly = !selected.editable;
      const dirty =
        draft.description !== skill.description ||
        draft.whenToUse !== (skill.whenToUse ?? '') ||
        draft.content !== (skill.content ?? '') ||
        draft.modelInvocable !== skill.invocation.modelInvocable ||
        draft.userInvocable !== skill.invocation.userInvocable;
      const copy = async (text, message) => {
        try {
          await navigator.clipboard.writeText(text);
          onNotify(message, 'ok');
        } catch {
          onNotify(t('toast.copyFailed'), 'error');
        }
      };
      return h(
        'div',
        { className: 'dsss-detail-inner' },
        h(
          'div',
          { className: 'dsss-detail-head' },
          h(Avatar, { item: selected, size: 44 }),
          h(
            'div',
            { style: { minWidth: 0, flex: 1 } },
            h('h1', { className: 'dsss-detail-title' }, selected.displayName || selected.name),
            h('div', { className: 'dsss-detail-name' }, selected.name),
            h(
              'div',
              { style: { display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' } },
              h(Chip, null, t(`source.${selected.sourceKind}`)),
              h(Chip, null, t(`scope.${selected.scope}`)),
              selected.runtime ? h(Chip, null, t('badge.runtime')) : null,
              selected.shadowed ? h(Chip, { kind: 'warn' }, t('badge.shadowed')) : null,
              selected.duplicateCount > 1 ? h(Chip, null, `${selected.duplicateCount} ${t('detail.duplicateCount')}`) : null,
            ),
          ),
        ),
        h(
          'div',
          { className: 'dsss-detail-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'dsss-btn',
              onClick: () => copy(`$${selected.name}`, t('detail.copied')),
            },
            h(Icon, { name: 'copy', size: 13 }),
            t('detail.copyInvocation'),
          ),
          selected.path
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dsss-btn',
                  onClick: () => copy(selected.path, t('detail.pathCopied')),
                },
                t('detail.copyPath'),
              )
            : null,
          h('span', { style: { flex: 1 } }),
          h(
            'button',
            { type: 'button', className: 'dsss-btn', onClick: () => onDuplicate(selected, detail) },
            h(Icon, { name: 'copy', size: 13 }),
            t('detail.duplicate'),
          ),
          selected.editable
            ? h(
                'button',
                { type: 'button', className: 'dsss-btn', 'data-variant': 'danger', onClick: () => onDelete(selected) },
                h(Icon, { name: 'trash', size: 13 }),
                t('detail.delete'),
              )
            : null,
          !readOnly
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dsss-btn',
                  'data-variant': 'primary',
                  disabled: busy || !dirty,
                  onClick: () => onSave({ ...draft, name: selected.name, path: selected.path }),
                },
                busy ? h('span', { className: 'dsss-spinner' }) : h(Icon, { name: 'check', size: 14 }),
                busy ? t('detail.saving') : t('detail.save'),
              )
            : null,
        ),
        dirty
          ? h(
              'div',
              { className: 'dsss-banner', 'data-kind': 'warn' },
              h('strong', null, t('detail.unsaved')),
              ` — ${t('detail.unsavedHint')}`,
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsss-btn',
                  'data-variant': 'ghost',
                  style: { marginLeft: '10px', padding: '2px 7px' },
                  onClick: () => {
                    setDraft({
                      description: skill.description,
                      whenToUse: skill.whenToUse ?? '',
                      content: skill.content ?? '',
                      modelInvocable: skill.invocation.modelInvocable,
                      userInvocable: skill.invocation.userInvocable,
                    });
                  },
                },
                t('detail.discard'),
              ),
            )
          : null,
        readOnly
          ? h(
              'div',
              { className: 'dsss-banner' },
              h('strong', null, t('detail.readonly')),
              ` — ${t('detail.readonlyHint')}`,
              selected.runtime ? ` ${t('detail.runtimeHint')}` : '',
            )
          : null,
        !selected.valid
          ? h('div', { className: 'dsss-banner', 'data-kind': 'error' }, selected.error || t('detail.invalid'))
          : null,
        selected.shadowed
          ? h('div', { className: 'dsss-banner', 'data-kind': 'warn' }, h('strong', null, t('detail.shadowed')), ` — ${t('detail.shadowedHint')}`)
          : null,
        h(
          'div',
          { className: 'dsss-section' },
          h('h2', { className: 'dsss-section-title' }, t('detail.invocation')),
          h(
            'div',
            { className: 'dsss-switches' },
            h(
              'div',
              { className: 'dsss-switch-row' },
              h(
                'div',
                { className: 'dsss-switch-copy' },
                h('div', { className: 'dsss-switch-title' }, t('detail.modelTitle')),
                h('div', { className: 'dsss-switch-hint' }, t('detail.modelHint')),
              ),
              h(Switch, {
                checked: draft.modelInvocable,
                disabled: readOnly || busy,
                label: t('detail.modelTitle'),
                onChange: (value) => {
                  const next = { modelInvocable: value, userInvocable: draft.userInvocable };
                  setDraft({ ...draft, ...next });
                  void onToggle(selected, next);
                },
              }),
            ),
            h(
              'div',
              { className: 'dsss-switch-row' },
              h(
                'div',
                { className: 'dsss-switch-copy' },
                h('div', { className: 'dsss-switch-title' }, t('detail.userTitle')),
                h('div', { className: 'dsss-switch-hint' }, t('detail.userHint')),
              ),
              h(Switch, {
                checked: draft.userInvocable,
                disabled: readOnly || busy,
                label: t('detail.userTitle'),
                onChange: (value) => {
                  const next = { modelInvocable: draft.modelInvocable, userInvocable: value };
                  setDraft({ ...draft, ...next });
                  void onToggle(selected, next);
                },
              }),
            ),
          ),
        ),
        h(
          'div',
          { className: 'dsss-section' },
          h(
            'div',
            { className: 'dsss-grid' },
            h(
              'div',
              { className: 'dsss-field' },
              h('label', { className: 'dsss-label', htmlFor: 'dsss-description' }, t('detail.description')),
              h('textarea', {
                id: 'dsss-description',
                className: 'dsss-textarea',
                style: { minHeight: '74px', fontFamily: 'inherit', fontSize: '13px' },
                value: draft.description,
                disabled: readOnly,
                onChange: (event) => setDraft({ ...draft, description: event.target.value }),
              }),
            ),
            h(
              'div',
              { className: 'dsss-field' },
              h('label', { className: 'dsss-label', htmlFor: 'dsss-when' }, t('detail.when')),
              h('textarea', {
                id: 'dsss-when',
                className: 'dsss-textarea',
                style: { minHeight: '74px', fontFamily: 'inherit', fontSize: '13px' },
                value: draft.whenToUse,
                disabled: readOnly,
                onChange: (event) => setDraft({ ...draft, whenToUse: event.target.value }),
              }),
            ),
          ),
        ),
        h(
          'div',
          { className: 'dsss-section' },
          h(
            'div',
            { className: 'dsss-editor-bar' },
            h('button', { type: 'button', className: 'dsss-mini-tab', 'aria-selected': mode === 'edit', onClick: () => setMode('edit') }, t('detail.edit')),
            h('button', { type: 'button', className: 'dsss-mini-tab', 'aria-selected': mode === 'preview', onClick: () => setMode('preview') }, t('detail.preview')),
          ),
          mode === 'edit'
            ? h('textarea', {
                className: 'dsss-textarea',
                value: draft.content,
                disabled: readOnly,
                spellCheck: false,
                onChange: (event) => setDraft({ ...draft, content: event.target.value }),
                onKeyDown: (event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                    event.preventDefault();
                    if (!readOnly && dirty) void onSave({ ...draft, name: selected.name, path: selected.path });
                  }
                },
              })
            : h(Markdown, { text: draft.content }),
        ),
        h(
          'div',
          { className: 'dsss-section' },
          h('h2', { className: 'dsss-section-title' }, t('detail.metadata')),
          h(
            'dl',
            { className: 'dsss-meta-list' },
            h('dt', null, t('detail.name')),
            h('dd', { className: 'dsss-mono' }, selected.name),
            h('dt', null, t('detail.provider')),
            h('dd', null, selected.provider),
            h('dt', null, t('detail.scope')),
            h('dd', null, `${t(`source.${selected.sourceKind}`)} · ${t(`scope.${selected.scope}`)}`),
            skill.interface?.defaultPrompt
              ? h('dt', null, t('detail.defaultPrompt'))
              : null,
            skill.interface?.defaultPrompt
              ? h('dd', { className: 'dsss-mono' }, skill.interface.defaultPrompt)
              : null,
            selected.path
              ? h('dt', null, t('detail.path'))
              : null,
            selected.path
              ? h(
                  'dd',
                  null,
                  h(
                    'div',
                    { className: 'dsss-path' },
                    h('code', { title: selected.path }, selected.path),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'dsss-btn',
                        'data-variant': 'ghost',
                        style: { padding: '2px 6px' },
                        onClick: () => copy(selected.path, t('detail.pathCopied')),
                      },
                      t('detail.copyPath'),
                    ),
                  ),
                )
              : null,
          ),
        ),
      );
    }

    function StudioPage({ ctx }) {
      const t = useLocale(ctx);
      const { state, loading, error, reload } = useStudio();
      const [query, setQuery] = useState('');
      const [filter, setFilter] = useState('all');
      const [selectedKey, setSelectedKey] = useState(null);
      const [detail, setDetail] = useState(null);
      const [detailLoading, setDetailLoading] = useState(false);
      const [detailError, setDetailError] = useState(null);
      const [detailNonce, setDetailNonce] = useState(0);
      const [draft, setDraft] = useState(null);
      const [createOpen, setCreateOpen] = useState(false);
      const [trashOpen, setTrashOpen] = useState(false);
      const [confirm, setConfirm] = useState(null);
      const [busy, setBusy] = useState(false);
      const [busyPath, setBusyPath] = useState(null);
      const [toast, setToast] = useState(null);
      const selectedRef = useRef(null);

      const skills = state?.skills ?? [];
      const roots = state?.roots ?? [];
      const creatableRoots = useMemo(() => roots.filter((root) => root.creatable), [roots]);
      const selected = useMemo(() => skills.find((item) => itemKey(item) === selectedKey) ?? null, [skills, selectedKey]);
      selectedRef.current = selected;
      const tabs = useMemo(
        () => [
          ['all', t('page.all')],
          ['codex', t('page.codex')],
          ['dsh', t('page.dsh')],
          ['agents', t('page.shared')],
          ['builtin', t('page.builtin')],
        ],
        [t],
      );
      const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return skills.filter((item) => {
          if (filter !== 'all') {
            const source = item.sourceKind === 'builtin' ? 'builtin' : item.sourceKind;
            if (source !== filter) return false;
          }
          if (!needle) return true;
          return (
            item.name.toLowerCase().includes(needle) ||
            (item.displayName ?? '').toLowerCase().includes(needle) ||
            (item.description ?? '').toLowerCase().includes(needle) ||
            (item.whenToUse ?? '').toLowerCase().includes(needle)
          );
        });
      }, [skills, filter, query]);
      const notify = useCallback((message, kind = 'ok') => {
        setToast({ message, kind, id: Date.now() });
      }, []);

      useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 4200);
        return () => clearTimeout(timer);
      }, [toast]);

      const select = useCallback(
        (item, options = {}) => {
          if (!options.force && draft && selectedRef.current && itemKey(selectedRef.current) !== itemKey(item)) {
            const current = detail?.skill;
            if (
              current &&
              (draft.description !== current.description ||
                draft.whenToUse !== (current.whenToUse ?? '') ||
                draft.content !== (current.content ?? ''))
            ) {
              if (!window.confirm(t('unsaved.confirm'))) return;
            }
          }
          setSelectedKey(item ? itemKey(item) : null);
        },
        [draft, detail, t],
      );

      useEffect(() => {
        if (!state) return;
        if (selectedKey && !skills.some((item) => itemKey(item) === selectedKey)) setSelectedKey(null);
      }, [state, skills, selectedKey]);

      useEffect(() => {
        if (!selected) {
          setDetail(null);
          setDraft(null);
          setDetailError(null);
          return undefined;
        }
        let cancelled = false;
        const controller = new AbortController();
        setDetailLoading(true);
        setDetailError(null);
        const params = new URLSearchParams();
        const usePath = selected.path && (selected.rootId !== null || selected.sourceKind !== 'builtin');
        if (usePath) params.set('path', selected.path);
        else params.set('name', selected.name);
        api(`skill?${params.toString()}`, { signal: controller.signal })
          .then((data) => {
            if (cancelled) return;
            setDetail(data);
            const skill = data.skill;
            setDraft({
              description: skill.description,
              whenToUse: skill.whenToUse ?? '',
              content: skill.content ?? '',
              modelInvocable: skill.invocation.modelInvocable,
              userInvocable: skill.invocation.userInvocable,
            });
          })
          .catch((cause) => {
            if (cancelled) return;
            const message = cause instanceof Error ? cause.message : String(cause);
            setDetailError(message);
            notify(message, 'error');
            setDetail(null);
            setDraft(null);
          })
          .finally(() => {
            if (!cancelled) setDetailLoading(false);
          });
        return () => {
          cancelled = true;
          controller.abort();
        };
      }, [selectedKey, selected?.path, selected?.name, detailNonce, notify]);

      const refresh = async (message) => {
        const data = await reload();
        setDetailNonce((value) => value + 1);
        if (message) notify(message, 'ok');
        return data;
      };

      const save = async (payload) => {
        setBusy(true);
        try {
          const result = await api('save', { method: 'POST', body: JSON.stringify(payload) });
          const data = await reload();
          const match = data?.skills.find((item) => item.path === result.path);
          if (match) setSelectedKey(itemKey(match));
          setDetailNonce((value) => value + 1);
          notify(t('detail.saved'), 'ok');
        } catch (cause) {
          notify(cause instanceof Error ? cause.message : t('error.save'), 'error');
        } finally {
          setBusy(false);
        }
      };

      const toggle = async (item, next) => {
        if (!item.editable || !item.path) return;
        setBusyPath(item.path);
        try {
          await api('invocation', {
            method: 'POST',
            body: JSON.stringify({ path: item.path, ...next }),
          });
          const data = await reload();
          if (selected && itemKey(selected) === itemKey(item)) {
            const current = data?.skills.find((entry) => itemKey(entry) === itemKey(item));
            if (current?.path) {
              const detailData = await api(`skill?path=${encodeURIComponent(current.path)}`);
              setDetail(detailData);
              setDraft({
                description: detailData.skill.description,
                whenToUse: detailData.skill.whenToUse ?? '',
                content: detailData.skill.content ?? '',
                modelInvocable: detailData.skill.invocation.modelInvocable,
                userInvocable: detailData.skill.invocation.userInvocable,
              });
            }
          }
          notify(t('toast.toggled'), 'ok');
        } catch (cause) {
          notify(cause instanceof Error ? cause.message : t('error.toggle'), 'error');
        } finally {
          setBusyPath(null);
        }
      };

      const remove = async (item) => {
        setConfirm({ item });
      };

      const confirmDelete = async () => {
        const item = confirm?.item;
        if (!item) return;
        setBusy(true);
        try {
          await api('delete', { method: 'POST', body: JSON.stringify({ path: item.path }) });
          setConfirm(null);
          setSelectedKey(null);
          await reload();
          notify(t('toast.deleted'), 'ok');
        } catch (cause) {
          notify(cause instanceof Error ? cause.message : t('delete.failed'), 'error');
        } finally {
          setBusy(false);
        }
      };

      const restore = async (entry) => {
        setBusyPath(entry.trashPath);
        try {
          await api('restore', { method: 'POST', body: JSON.stringify({ trashPath: entry.trashPath }) });
          await reload();
          notify(t('trash.restored'), 'ok');
        } catch (cause) {
          notify(cause instanceof Error ? cause.message : t('trash.failed'), 'error');
        } finally {
          setBusyPath(null);
        }
      };

      const duplicate = (item, detailData) => {
        const base = Math.max(1, item.duplicateCount || 1);
        setCreateOpen({ duplicate: { source: detailData?.skill ?? item, name: `${item.name}-copy${base > 1 ? `-${base}` : ''}` } });
      };

      const create = async (payload) => {
        const result = await api('save', { method: 'POST', body: JSON.stringify(payload) });
        const data = await reload();
        const match = data?.skills.find((item) => item.path === result.path);
        if (match) select(match, { force: true });
        notify(t('toast.created'), 'ok');
      };

      if (error && !state) {
        return h(
          'div',
          { className: 'dsss-page' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'dsss-error-box' },
            h('h2', null, t('page.loadError')),
            h('p', null, error),
            h('button', { type: 'button', className: 'dsss-btn', 'data-variant': 'primary', onClick: () => void reload() }, t('page.retry')),
          ),
        );
      }
      if (loading && !state) {
        return h('div', { className: 'dsss-page' }, h('style', null, CSS), h('div', { className: 'dsss-loading' }, h('span', { className: 'dsss-spinner' }), t('page.loading')));
      }

      const trashCount = state?.trash?.length ?? 0;
      return h(
        'div',
        { className: 'dsss-page' },
        h('style', null, CSS),
        h(
          'header',
          { className: 'dsss-header' },
          h(
            'div',
            { className: 'dsss-heading' },
            h('h1', { className: 'dsss-title' }, t('page.title')),
            h('p', { className: 'dsss-subtitle' }, t('page.subtitle')),
          ),
          h(
            'div',
            { className: 'dsss-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'dsss-btn',
                'data-variant': 'ghost',
                disabled: loading,
                onClick: () => setTrashOpen(true),
              },
              h(Icon, { name: 'trash', size: 14 }),
              `${t('page.trash')}${trashCount ? ` (${trashCount})` : ''}`,
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsss-btn dsss-icon-btn',
                'data-variant': 'ghost',
                'aria-label': t('page.refresh'),
                title: t('page.refresh'),
                disabled: loading,
                onClick: () => void refresh(),
              },
              loading ? h('span', { className: 'dsss-spinner' }) : h(Icon, { name: 'refresh', size: 15 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsss-btn',
                'data-variant': 'primary',
                onClick: () => setCreateOpen({}),
              },
              h(Icon, { name: 'plus', size: 14 }),
              t('page.new'),
            ),
          ),
        ),
        h(
          'div',
          { className: 'dsss-toolbar' },
          h(
            'div',
            { className: 'dsss-tabs', role: 'tablist', 'aria-label': t('page.title') },
            tabs.map(([value, label]) =>
              h(
                'button',
                {
                  key: value,
                  type: 'button',
                  className: 'dsss-tab',
                  role: 'tab',
                  'aria-selected': filter === value,
                  onClick: () => setFilter(value),
                },
                label,
              ),
            ),
          ),
          h(
            'div',
            { className: 'dsss-search' },
            h(Icon, { name: 'search', size: 14 }),
            h('input', {
              className: 'dsss-input',
              value: query,
              placeholder: t('page.search'),
              'aria-label': t('page.search'),
              onChange: (event) => setQuery(event.target.value),
            }),
          ),
          h('span', { className: 'dsss-count' }, `${filtered.length} ${t('page.count')}`),
        ),
        h(
          'div',
          { className: 'dsss-body' },
          h(
            'aside',
            { className: 'dsss-list', 'aria-label': t('page.title') },
            filtered.length === 0
              ? h(
                  'div',
                  { className: 'dsss-empty-page', style: { minHeight: '240px' } },
                  h('div', { className: 'dsss-empty-icon' }, h(Icon, { name: 'spark', size: 24 })),
                  h('h2', { className: 'dsss-empty-title' }, t('page.emptyTitle')),
                  h('p', { className: 'dsss-empty-body' }, t('page.emptyBody')),
                  h(
                    'button',
                    { type: 'button', className: 'dsss-btn', 'data-variant': 'primary', onClick: () => setCreateOpen({}) },
                    h(Icon, { name: 'plus', size: 14 }),
                    t('page.emptyAction'),
                  ),
                )
              : filtered.map((item) =>
                  h(SkillRow, {
                    key: itemKey(item),
                    item,
                    selected: selectedKey === itemKey(item),
                    busy: busyPath === item.path,
                    t,
                    onSelect: select,
                    onToggle: toggle,
                  }),
                ),
          ),
          h(
            'main',
            { className: 'dsss-detail' },
            h(DetailPane, {
              selected,
              detail,
              draft,
              setDraft,
              loading: detailLoading,
              error: detailError,
              busy,
              t,
              onSave: save,
              onDelete: remove,
              onDuplicate: duplicate,
              onToggle: toggle,
              onNotify: notify,
              onRetry: () => setDetailNonce((value) => value + 1),
            }),
          ),
        ),
        h(CreateDialog, {
          open: Boolean(createOpen),
          roots: creatableRoots,
          skills,
          initialRootId: createOpen?.duplicate?.source?.rootId ?? (creatableRoots.find((root) => root.id === 'codex-user')?.id ?? creatableRoots[0]?.id ?? ''),
          duplicate: createOpen?.duplicate ?? null,
          t,
          onClose: () => setCreateOpen(null),
          onCreate: create,
        }),
        h(TrashDialog, {
          open: trashOpen,
          entries: state?.trash ?? [],
          busyPath,
          t,
          onClose: () => setTrashOpen(false),
          onRestore: restore,
        }),
        confirm
          ? h(ConfirmDialog, {
              title: t('delete.title'),
              body: `${confirm.item.displayName || confirm.item.name} — ${t('delete.body')}`,
              confirmLabel: busy ? t('delete.deleting') : t('delete.confirm'),
              cancelLabel: t('delete.cancel'),
              busy,
              danger: true,
              onCancel: () => setConfirm(null),
              onConfirm: confirmDelete,
            })
          : null,
        toast
          ? h(
              'div',
              { className: 'dsss-toast', 'data-kind': toast.kind, role: 'status' },
              h(Icon, { name: toast.kind === 'error' ? 'close' : 'check', size: 14 }),
              toast.message,
            )
          : null,
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register(NS, { zh: ZH, en: EN }),
          'skill-studio: locale dictionaries',
        );
        const t = ctx.locale.bind(NS);
        const Page = () => h(StudioPage, { ctx });
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'skill-studio',
              order: 2,
              label: () => t('nav.title'),
            },
            SkillNavIcon,
          ),
        );
        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: 'skill-studio',
            },
            Page,
          ),
        );
      },
    };
  },
});

