import React from "react";

export interface ChatMessageProps {
  username: string;
  text: string;
  avatarUrl?: string;
  isGift?: boolean;
  isModerator?: boolean;
  isSubscriber?: boolean;
  className?: string;
}

/**
 * Mensagem de chat da live.
 * Exemplo visual:
 *  [avatar]  @viniciusfaustino  (MOD) (SUB)
 *            mandou: "manda salve pra Iguaba!!!"
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  username,
  text,
  avatarUrl,
  isGift = false,
  isModerator = false,
  isSubscriber = false,
  className = ""
}) => {
  return (
    <div
      className={[
        "flex w-full max-w-full items-start gap-3 rounded-xl px-3 py-2 text-[13px] leading-[1.4]",
        isGift
          ? "bg-[rgba(255,215,0,0.07)] ring-1 ring-yellow-300/30 shadow-[0_30px_80px_rgba(0,0,0,.8)]"
          : "bg-[rgba(255,255,255,0.03)] ring-1 ring-white/10 shadow-[0_30px_80px_rgba(0,0,0,.8)]",
        className
      ].join(" ")}
      style={{
        color: "rgba(255,255,255,0.9)",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif'
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center text-[10px] font-medium text-white/70 uppercase">
            {username.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1 text-[12px] leading-none">
          <span className="font-semibold text-white/90 break-all max-w-[140px] truncate">
            @{username}
          </span>

          {isModerator && (
            <span className="rounded-md bg-blue-500/20 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-blue-300 ring-1 ring-blue-400/30">
              MOD
            </span>
          )}

          {isSubscriber && (
            <span className="rounded-md bg-purple-500/20 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-purple-300 ring-1 ring-purple-400/30">
              SUB
            </span>
          )}

          {isGift && (
            <span className="rounded-md bg-yellow-400/20 px-1.5 py-[2px] text-[10px] font-semibold leading-none text-yellow-200 ring-1 ring-yellow-300/30">
              🎁 GIFT
            </span>
          )}
        </div>

        <div className="mt-1 text-[13px] text-white/80 break-words">
          {text}
        </div>
      </div>
    </div>
  );
};
