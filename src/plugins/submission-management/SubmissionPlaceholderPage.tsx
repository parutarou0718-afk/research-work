export function SubmissionPlaceholderPage() {
  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="mx-auto max-w-3xl space-y-3">
        <h1 className="text-2xl font-semibold">投稿管理</h1>
        <p className="text-muted-foreground">
          该模块将用于管理期刊投稿、稿件版本、返修轮次和投稿状态。
        </p>
        <p className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          当前为插件架构验证页面，尚未启用真实投稿数据。
        </p>
      </div>
    </div>
  )
}
