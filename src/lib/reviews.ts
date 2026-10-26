export interface Review {
  name: string
  role: string
  text: string
  when: string
}

/**
 * IMPORTANT: these are SAMPLE reviews so the layout can be previewed. Replace them with feedback from
 * real customers (with their permission), then set SAMPLE_REVIEWS to false. Showing invented reviews as
 * genuine ones misleads customers and can break consumer-protection rules.
 */
export const SAMPLE_REVIEWS = true

export const REVIEWS: Review[] = [
  { name: 'Rohan Deshmukh', role: 'Reel creator', when: '2 hours ago', text: 'Paid through PhonePe and the balance showed up before I closed the app. Ordering took less than a minute.' },
  { name: 'Priya Nair', role: 'Fashion page owner', when: '5 hours ago', text: 'The Premium followers have stayed put for weeks. The grades make it easy to see what you are paying for.' },
  { name: 'Imran Qureshi', role: 'YouTuber', when: '9 hours ago', text: 'Pro views kept good watch time on my longer videos. Worth the extra money for the videos that matter.' },
  { name: 'Kavya Iyer', role: 'Small business', when: '1 day ago', text: 'Support replied in Hindi and sorted my order question quickly. That alone made me stay.' },
  { name: 'Harsh Vardhan Singh', role: 'Agency owner', when: '1 day ago', text: 'Clean dashboard on mobile. I place orders for three client pages from my phone without any trouble.' },
  { name: 'Neha Kulkarni', role: 'Student creator', when: '2 days ago', text: 'Started with the Standard grade to test. Prices are clear and there were no surprise charges.' },
  { name: 'Siddharth Joshi', role: 'Musician', when: '2 days ago', text: 'Used the free views bonus on my new reel after my first top-up. A nice way to begin.' },
  { name: 'Pooja Bansal', role: 'Boutique owner', when: '3 days ago', text: 'Indian followers helped my page look local to customers. Order tracking is easy to follow.' },
  { name: 'Arjun Menon', role: 'Travel vlogger', when: '3 days ago', text: 'The UPI app buttons open straight with the amount filled in. No copying numbers around.' },
  { name: 'Simran Kaur', role: 'Content creator', when: '4 days ago', text: 'I like that Standard, Premium and Pro are separated clearly. I know where my money is going.' },
  { name: 'Faizan Ahmed', role: 'Reseller', when: '4 days ago', text: 'Referral earnings are tracked in one place and the withdraw form is simple.' },
  { name: 'Divya Chauhan', role: 'Beauty creator', when: '5 days ago', text: 'Smooth site, fast loading, and the order status updates when I refresh. Good experience overall.' },
  { name: 'Nikhil Agarwal', role: 'Startup founder', when: '5 days ago', text: 'Needed a quick boost before a launch. The Premium grade started delivering the same day.' },
  { name: 'Tanvi Shah', role: 'Fitness coach', when: '6 days ago', text: 'Simple to use even for someone who is not techy. The explanations on each service helped a lot.' },
  { name: 'Rahul Pandey', role: 'Gaming channel', when: '6 days ago', text: 'Shorts views began within a couple of hours. I will be back for the next upload.' },
  { name: 'Ishita Roy', role: 'Photographer', when: '1 week ago', text: 'Good value on the Standard likes. I topped up again within the same week.' },
  { name: 'Manish Yadav', role: 'Local shop', when: '1 week ago', text: 'Payment, order and tracking all in one place. It feels like a proper product, not a rushed site.' },
  { name: 'Ayesha Siddiqui', role: 'Lifestyle creator', when: '1 week ago', text: 'Support answered my question politely and the refill cover on my order was explained clearly.' },
]
