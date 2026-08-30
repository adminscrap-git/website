"use client";

import { useState } from "react";
import { waLink } from "@/lib/whatsapp";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ButtonAnchor } from "@/components/ui/button";

/**
 * A contact form with no backend.
 *
 * A form that emails into an inbox nobody watches is worse than no form. This
 * composes the message and hands it to WhatsApp, where the business already
 * lives — they get it instantly on their phone and can reply in the same thread.
 *
 * The link is live as you type, so there is no submit state to get wrong.
 */
export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const ready = name.trim().length > 1 && message.trim().length > 3;

  const body = [
    `Hi MINT — ${message.trim()}`,
    "",
    `From: ${name.trim()}`,
    phone.trim() && `Number: ${phone.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="rounded-toy bg-paper-2 p-6 sm:p-8">
      <h2 className="display text-3xl">Send us a message</h2>
      <p className="mt-2 text-base font-semibold text-ink-2">
        Opens WhatsApp with everything typed out. You just tap send.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="cName" required>
          <Input
            id="cName"
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            placeholder="Priya Sharma"
            className="bg-paper"
          />
        </Field>

        <Field label="Mobile number" htmlFor="cPhone" hint="Optional.">
          <Input
            id="cPhone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            className="bg-paper"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="What's on your mind?" htmlFor="cMessage" required>
            <Textarea
              id="cMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I've got an old generator in the basement — do you take those?"
              className="bg-paper"
            />
          </Field>
        </div>
      </div>

      <div className="mt-7">
        {ready ? (
          <ButtonAnchor
            href={waLink(whatsapp, body)}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
          >
            Open WhatsApp →
          </ButtonAnchor>
        ) : (
          <p className="text-base font-bold text-ink-3">
            Add your name and a message to continue.
          </p>
        )}
      </div>
    </div>
  );
}
