import { motion } from 'framer-motion';

const team = [
  {
    name: 'Zac Tavenner',
    role: 'CEO',
    bio: 'Former Division 1 athlete and UC Berkeley graduate. He combines athletic discipline with strategic vision to drive innovative AI-powered fundraising solutions connecting fund managers with investors.',
    img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/15fbc20634d84140a729b179efab59b2/original/AGV_vUcCoz5LVjbmiDlYRpSGU5lhSzrQKT1xke5SQ6-JmmivakPEOenG4IpDb-KnbZQTFjytNv-2oogT2AojjwNmD29BKwPEthSiQ4FGe3ACWYizFK6rZCW3lb6ZsI8wIIEDEEvGuc48hA-s2048.png',
  },
  {
    name: 'Coleton Fisher',
    role: 'President',
    bio: 'Coleton drives operational excellence and client success. He manages campaign delivery and partnership growth to ensure high performance results.',
    img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/f918b2ad61954ec5a058e33431293d8c/original/AGV_vUfks8AxzqgqkT5oqSmwsFQ8mb0IRgL7PcYHxO33giQ2OKp9Sf2ozL7bTasOcHt8rqj0sFewD31jdKPoa-k-xnTQ3FmWcyPT1XT6ZcMCUSHFyC7DS40tJf2w8agjz7DadKN_zMk8-s2048.png',
  },
  {
    name: 'Nic Meersham',
    role: 'Media Buyer',
    bio: 'Ex-Googler with $150M in ad spend under his belt across Google & Meta. Former UC Berkeley Graduate & Rugby National Champion.',
    img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/df1935788dc0430b82180eb9b57f15b5/original/image.png',
  },
  {
    name: 'Emily Bradshaw',
    role: 'Account Manager',
    bio: 'Emily handles client communications and campaign management, ensuring smooth project execution and responsive support throughout the fundraising process.',
    img: 'https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:2000/https://cdn.gamma.app/jkntb5cd1omt1jx/20d7e92b8cf448f1b242fa2fe5a035eb/original/AGV_vUf-nu-WvFG6Rsez8mGdlhJ57gXgEZ-e78ZtqyfwZn6TId_AAw_mHYq7s22td3ddMxY7I1ngyZ3gQaFRq5ShiMtTz70ATCanGsh-qcF8KWftNo2X3h0BYb9s2OdaJ15x9GfLRwdfBQ-s2048.png',
  },
];

export default function ExecutiveTeam() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-primary font-display font-semibold text-sm uppercase tracking-wider mb-3">Executive Team</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Meet the <span className="gradient-text">Team</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {team.map((t, i) => (
            <motion.div
              key={t.name}
              className="glass-card rounded-2xl overflow-hidden group hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-4 md:p-5">
                <h3 className="font-display font-bold text-foreground text-sm md:text-base">{t.name}</h3>
                <p className="text-primary text-xs md:text-sm font-semibold mb-2">{t.role}</p>
                <p className="text-muted-foreground text-xs leading-relaxed hidden md:block">{t.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
