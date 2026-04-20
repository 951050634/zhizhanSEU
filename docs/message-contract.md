# 展厅终端、网页与云端消息约定

## 1. 文档目的

本文件用于固定无实物板阶段的三方消息结构，避免网页中控、未来 `ESP-IDF` 固件与云端接入各自独立设计字段。当前阶段仅完成协议约定与模拟数据驱动，不声明任何板级联调已验证。

## 2. 统一消息包结构

所有实时消息统一采用单层包络，网页端当前用模拟数据发送，后续设备端与云端接入时继续沿用。

```json
{
  "type": "ask_question",
  "source": "device",
  "target": "web",
  "sessionId": "demo-session-001",
  "timestamp": "2026-04-20T14:30:00+08:00",
  "payload": {}
}
```

字段说明如下：

- `type`：消息类型，当前固定为 `wake`、`select_exhibit`、`ask_question`、`cloud_result`
- `source`：发送方，取值建议为 `device`、`web`、`cloud`、`mock-console`
- `target`：接收方，取值建议为 `web`、`device`、`cloud`
- `sessionId`：一次导览或一次交互会话的唯一标识
- `timestamp`：ISO 8601 时间戳，统一使用东八区或 UTC 后再在前端转换
- `payload`：与具体消息相关的业务字段

## 3. 终端到网页事件

### 3.1 `wake`

用于表示终端从待机进入可交互状态，通常由姿态唤醒或触摸触发。

```json
{
  "type": "wake",
  "source": "device",
  "target": "web",
  "sessionId": "demo-session-001",
  "timestamp": "2026-04-20T14:31:00+08:00",
  "payload": {
    "state": "active",
    "trigger": "imu_pickup",
    "batteryMode": "normal"
  }
}
```

字段约束：

- `state`：建议值为 `active`
- `trigger`：建议值为 `imu_pickup`、`touch`、`manual`
- `batteryMode`：预留给未来低功耗状态机，建议值为 `normal`、`low_power`

### 3.2 `select_exhibit`

用于表示终端侧已选中某个展项，网页端据此切换大屏主展示区。

```json
{
  "type": "select_exhibit",
  "source": "device",
  "target": "web",
  "sessionId": "demo-session-001",
  "timestamp": "2026-04-20T14:31:08+08:00",
  "payload": {
    "exhibitId": "chip-history",
    "exhibitTitle": "芯片发展历程",
    "trigger": "touch"
  }
}
```

字段约束：

- `exhibitId`：英文短标识，后续固件、网页和云端均以它作为展项主键
- `exhibitTitle`：当前阶段保留，便于日志与大屏直接显示
- `trigger`：建议值为 `touch` 或 `voice`

### 3.3 `ask_question`

用于表示用户围绕当前展项发起问答。无板阶段网页用模拟输入触发，后续硬件接入后由语音识别前链路或语音上传流程产生。

```json
{
  "type": "ask_question",
  "source": "device",
  "target": "cloud",
  "sessionId": "demo-session-001",
  "timestamp": "2026-04-20T14:31:18+08:00",
  "payload": {
    "requestId": "req-0001",
    "exhibitId": "chip-history",
    "inputMode": "voice",
    "question": "这项技术为什么适合展厅讲解？"
  }
}
```

字段约束：

- `requestId`：单次问答请求编号，云端返回结果时必须回传
- `exhibitId`：问题上下文绑定的展项
- `inputMode`：建议值为 `voice` 或 `text`
- `question`：原始问题文本。若未来走原始音频上传，则在云端转写后补写入该字段

## 4. 云端到网页结果

### 4.1 `cloud_result`

该消息是无板阶段最重要的展示对象。网页中控当前直接消费它，未来设备端也消费其中的摘要字段。

```json
{
  "type": "cloud_result",
  "source": "cloud",
  "target": "web",
  "sessionId": "demo-session-001",
  "timestamp": "2026-04-20T14:31:21+08:00",
  "payload": {
    "requestId": "req-0001",
    "intent": "explain_exhibit",
    "title": "为什么这类技术适合展厅导览",
    "summary": "系统把终端上的选择动作与云端问答结果同步到大屏，让观众在公共展示面上获得完整解释。",
    "detail": "终端负责采集与唤醒，网页负责视觉呈现，云端大模型负责把问题转成结构化解说内容，因此同一套架构可以支持多展项复用与快速切换。",
    "followup": [
      "它与传统语音讲解器有什么区别？",
      "多屏联动如何提升观众体验？"
    ],
    "confidence": 0.93,
    "status": "completed"
  }
}
```

字段约束：

- `intent`：中间语义字段，当前固定沉淀以下值
  - `explain_exhibit`
  - `compare_exhibits`
  - `guide_next_step`
  - `fallback`
- `title`：回答标题，供大屏主区和终端标题摘要共用
- `summary`：一段可直接给终端小屏消费的摘要
- `detail`：大屏展开解释内容
- `followup`：后续推荐问题数组，建议 2 至 3 条
- `confidence`：可选，便于未来调试质量
- `status`：当前建议值为 `completed`、`fallback`、`error`

## 5. 网页端内部状态与模拟数据格式

无板阶段，网页中控直接维护一份模拟状态对象，建议字段如下：

```json
{
  "awakened": true,
  "deviceState": "结果展示",
  "selectedExhibitId": "chip-history",
  "cloudStatus": "结果已返回",
  "lastQuestion": "这项技术为什么适合展厅讲解？",
  "lastIntent": "explain_exhibit"
}
```

网页端的模拟展项数据建议采用如下结构：

```json
{
  "id": "chip-history",
  "title": "芯片发展历程",
  "theme": "从器件演进到智能终端",
  "summary": "用于大屏首屏摘要",
  "detail": "用于大屏展开内容与演示脚本",
  "accent": "#6ee7d8"
}
```

## 6. 未来设备端消费字段

终端小屏不需要完整长文，因此未来设备端只强制消费以下字段：

- `title`
- `summary`
- `followup`
- `status`

也就是说，哪怕大屏侧未来追加图片、视频、超长说明，设备端仍只依赖上面四个字段即可完成摘要显示。

## 7. 实施建议

- `web/` 当前应当以该文档为唯一接口约束，不再另起字段命名。
- `firmware/` 未来建立 `ws_client` 与 `cloud_bridge` 时，优先复用这里的 `type` 与 `payload` 结构。
- 云端侧若必须增加平台专有字段，应放入 `payload.meta`，不要破坏主结构。
- 板子到手后，只替换消息来源，不替换消息格式。

