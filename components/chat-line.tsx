import Balancer from "react-wrap-balancer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import { formattedText } from "@/lib/utils";

const convertNewLines = (text: string) =>
  text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ));

// Minimal shape that matches what `useChat` returns
interface ChatLineProps {
  role?: "user" | "assistant" | "system";
  parts: Array<{ type: "text"; text: string } | any>;
  sources: string[];
}

export function ChatLine({ role = "assistant", parts, sources }: ChatLineProps) {
  if (!parts) return null;

  console.log("parts:",parts);

  const text = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  const formattedMessage = convertNewLines(text);

  return (
    <div>
      <Card className="mb-2">
        <CardHeader>
          <CardTitle
            className={
              role !== "assistant"
                ? "text-amber-500 dark:text-amber-200"
                : "text-blue-500 dark:text-blue-200"
            }
          >
            {role === "assistant" ? "AI" : "You"}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-sm">
          <Balancer>{formattedMessage}</Balancer>
        </CardContent>

        <CardFooter>
          <CardDescription className="w-full">
            {sources.length ? (
              <Accordion type="single" collapsible className="w-full">
                {sources.map((source, idx) => (
                  <AccordionItem value={`source-${idx}`} key={idx}>
                    <AccordionTrigger>{`Source ${idx + 1}`}</AccordionTrigger>
                    <AccordionContent>
                      <ReactMarkdown>
                        {formattedText(source)}
                      </ReactMarkdown>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : null}
          </CardDescription>
        </CardFooter>
      </Card>
    </div>
  );
}
