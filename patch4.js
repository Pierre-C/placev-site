const fs = require('fs');

let content = fs.readFileSync('components/sections/ContactBlock.tsx', 'utf8');

content = content.replace('md:grid-cols-2', 'md:grid-cols-3');

if (!content.includes('import { Newsletter }')) {
  content = content.replace(
    /import \{ MapPin, Phone, Mail, Clock, Send \} from "lucide-react";/,
    `import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";\nimport { Newsletter } from "@/components/Newsletter";`
  );
}

content = content.replace(
  /<\/div>\s*<\/div>\s*<\/section>/,
  `</div>\n        <div data-testid="contact-newsletter" className="rounded-2xl border border-black/5 bg-white p-6">\n          <Newsletter variant="default" />\n        </div>\n      </div>\n    </section>`
);

fs.writeFileSync('components/sections/ContactBlock.tsx', content);