# Research notes: Pelajaran Hidup dari Harvest Moon Back to Nature

Session: dawnbook-harvest-moon. Plan: docs/code-plan/plans/2026-10-23-dawnbook-harvest-moon.md.
Method: 7 read-only researcher subagents on 2026-10-23. Three extracted game facts from the official Prima guide (sets A, B, C; OCR text, no web). Four read lesson sources with TinyFish `search` and `fetch_content` (sets L1-L4). The parent re-checked every DOI in the source table with the doi.org handle API (all 14 return responseCode 1) and every other URL with curl (15 return 200; amanet.org and econlib.org return 403 and stlouisfed.org times out for curl because of bot walls, and all three were read through TinyFish by the researchers). Every URL was accessed on 2026-10-23.

Game source: Debra McBride and David Cassady, *Harvest Moon: Back to Nature, Prima's Official Strategy Guide*, Prima Games (a division of Random House), 2000, ISBN 0-7615-3271-4 (L4-1c). Text read from the archive.org scan (source table S1). Line numbers in sets A, B, C (now in a private local file, see section 1 to 3) refer to the owner's local copy of that scan's OCR text (11.722 lines); the copy is not in this repository.

## 0. Rules for chapter authors

- Use only facts marked H or M. Phrase M facts with care ("menurut panduan resmi", "tercatat di panduan"). Never use a U item.
- Game facts come only from sets A, B, C (the guide) and L4-1 (release data). Do not add game facts from memory: no unlisted crop prices, events, characters, endings, or mechanics. If a fact is not in these notes, leave it out.
- Lesson facts come only from sets L1-L4, at the level the source supports. Most papers were read at abstract level: do not add sample sizes, effect sizes, or details not written here. Keep each item's caveats (correlation is not causation, "dikaitkan dengan", "menurut perkiraan").
- The game is the lens, the lesson is the point. Never claim that a study is about the game, and never claim the game "teaches" or "proves" a finding. Mark analogies as analogies ("mirip dengan", "seperti").
- Copyright: paraphrase the guide in Indonesian. At most one short English quote from the guide per chapter (11 words or fewer), always attributed. Never copy a table or a list from the guide.
- Every Referensi entry must be a URL from the source table (section 9).
- One owner chapter per fact (section 7). Another chapter may refer back with "di bab N" but does not restate the numbers.
- Numbers in Indonesian style: decimal comma, dot thousands (1.500 G, 0,24). Gold is written "G" after the number, as in the game ("1.500 G").
- Character pronouns: the guide calls the farmer "he" (a boy). In the book, address the reader as "kamu" and call the farmer "tokoh kita" or "si petani muda".
- Known contradictions inside the guide (section 6). Use the safe wording given there.

## 1 to 3. Game-fact sets A, B, C (kept outside the repository)

The three game-fact sets quote the copyrighted Prima guide line by line, so they are not in this public repository. They live in the owner's local file `~/.config/dawnbook/private-notes/research-dawnbook-harvest-moon-guide-sets.md` (mode 600), moved there on 2026-10-23 after review V3. Item IDs stay as cited in section 7 and in the review report:

- Set A (chapters 01 to 05): A1-1 to A1-17, A2-1 to A2-14, A3-1 to A3-14, A4-1 to A4-18, A5-1 to A5-14.
- Set B (chapters 06, 07, 08, 13): B-1 to B-121.
- Set C (chapters 09 to 12): C-1 to C-98.

Each item there gives a confidence mark, the guide's line numbers in the OCR text, and a short quote. The book itself paraphrases them in Indonesian; the book test checks that no chapter shares a 12-word run with the guide and that this file and the plan share no 16-word run with it.

## 4. Sets L1 and L2, lesson sources for chapters 01-07

Researcher report, kept verbatim except ID prefixes and headings.

All twelve items below were read this session (access date 2026-10-23), using 17 tool calls (TinyFish `search` and `fetch_content`, plus three read-only Bash parses of saved fetch output). Three claims in your brief need care, and the first is the most important.
- **The "40 percent" figure is an interview remark, not a measured result.** I found it only on the APA page and in a 2001 CNN interview, not in the 2001 paper's abstract or the APA press release (L1-3b).
- **The Pega finding is observational and modelled.** The authors say they "cannot be certain that a causal association exists" (L1-2c).
- **The Van Dongen "up to 2 nights" figure is an upper bound.** The abstract does not say which sleep condition produced it (L1-2b).

**L1-1a (H).** Weick, K. E. (1984). Small wins: Redefining the scale of social problems. *American Psychologist, 39*(1), 40-49. DOI https://doi.org/10.1037/0003-066X.39.1.40, which resolves to the PsycNet landing page (fetched).
- **Finding:** This is a conceptual argument about how social problems are framed. It is not an empirical study, and it does not measure motivation or personal habits. The PsycNet record says it is "Argues that the massive scale..."
- **Quotes (PsycNet abstract, H):**
  - "Reformulation of social issues as mere problems allows for a strategy of small wins wherein a series of concrete, complete outcomes of moderate importance build a pattern that attracts allies and deters opponents."
  - "It is concluded that the strategy of small wins incorporates sound psychology and is sensitive to the pragmatics of policymaking."
- **Quotes (full-text copy, M):** I read a university-hosted PDF copy at https://homepages.se.edu/cvonbergen/files/2013/01/Small-Wins_Redefining-the-Scale-of-Social-Problems.pdf. I rejoined its line-break hyphens.
  - "A small win is a concrete, complete, implemented outcome of moderate importance. By itself, one small win may seem unimportant. A series of wins at small but significant tasks, however, reveals a pattern that may attract allies, deter opponents, and lower resistance to subsequent proposals."
  - "The massive scale on which social problems are conceived often precludes innovative action because the limits of bounded rationality are exceeded and arousal is raised to dysfunctionally high levels."
- **Caveats:**
  - Weick's examples are hunger, crime, heart disease, traffic congestion and pollution. Applying "small wins" to a person's own habits is an extension, not his claim.
  - The PDF's printed abstract is shorter than the PsycNet abstract. Quote the PsycNet wording.
  - Amabile and Kramer's HBR blog "Small Wins and Feeling Good" (13 May 2011, https://hbr.org/2011/05/small-wins-and-feeling-good, fetched) paraphrases Weick: "large social problems are best broken down into smaller ones with concrete achievable goals."

**L1-1b (H for the headline claim, M for the study size).** Amabile, T. M., & Kramer, S. J. (2011). The power of small wins. *Harvard Business Review* (May 2011), https://hbr.org/2011/05/the-power-of-small-wins.
- **Volume and pages:** *HBR* volume 89, issue 5, starting page 70, is confirmed only by a search-result snippet from a thesis. I did not confirm the end page.
- **Paywall:** I read only the HBR page summary and opening paragraph. The article body is paywalled and was not read.
- **Quotes (HBR summary):**
  - "In an analysis of knowledge workers' diaries, the authors found that nothing contributed more to a positive inner work life (the mix of emotions, motivations, and perceptions that is critical to performance) than making progress in meaningful work."
  - "Even small wins can boost inner work life tremendously. On the flip side, small losses or setbacks can have an extremely negative effect."
- **Study size** comes from the authors' own interview at https://www.amanet.org/articles/the-worth-of-small-wins-teresa-amabile-and-steven-kramer-on-the-progress-principle/. The page metadata date is 2019-01-24, and the original interview date is not shown. It also matches the HBS record of their book at https://www.hbs.edu/faculty/Pages/item.aspx?num=40692. Quotes:
  - "In total, we received nearly 12,000 of these diaries from 238 people working on 26 creative teams in seven companies."
  - "In fact, 76% of our participants' very best days involved making progress."
  - "nearly 28% of these small events had a big impact on inner work life."
  - HBS: "nearly 12,000 diary entries provided by 238 employees in seven companies".
- **Caveats:**
  - The 238, 26 teams and 7 companies figures are not verified against the HBR article body.
  - The data are self-reported diaries from workers on creative project teams, and the analysis is correlational. The authors say: "While it's difficult to draw strong conclusions based on the small number of organizations we studied".
  - The "76%" is the share of best days that involved progress. It is not a causal effect size.
  - The authors also say setbacks hurt "two to three times" more than progress helps.
  - Their "small win" means a small step of progress. Weick's definition is narrower (a concrete, complete, implemented outcome).

**L1-2a (H).** Watson, N. F., Badr, M. S., Belenky, G., et al. (2015). Recommended amount of sleep for a healthy adult: a joint consensus statement of the American Academy of Sleep Medicine and Sleep Research Society. Published in two journals.
- ***Sleep* 2015;38(6):843-844**, doi:10.5665/sleep.4716. I read the full text at https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/. I did not fetch doi.org/10.5665/sleep.4716 itself; the DOI is printed on the PMC page.
- ***J Clin Sleep Med* 2015;11(6):591-592**, https://doi.org/10.5664/jcsm.4758. This resolves to https://link.springer.com/article/10.5664/jcsm.4758, but only the abstract and citation were readable (paywalled preview). That abstract does not state the 7-hour number; the statement body does, in the *Sleep* version.
- **Quotes (statement body, PMC):**
  - "Adults should sleep 7 or more hours per night on a regular basis to promote optimal health."
  - "Sleeping less than 7 hours per night on a regular basis is associated with adverse health outcomes, including weight gain and obesity, diabetes, hypertension, heart disease and stroke, depression, and increased risk of death. Sleeping less than 7 hours per night is also associated with impaired immune function, increased pain, impaired performance, increased errors, and greater risk of accidents."
- **Caveats:**
  - The panel had 15 experts, used a modified RAND Appropriateness Method, and reviewed 5,314 articles. The statement is for adults aged 18 to 60 years, and the wording is "associated with", not causal.
  - It says: "Individual variability in sleep need is influenced by genetic, behavioral, medical, and environmental factors."
  - It says more than 9 hours "may be appropriate for young adults, individuals recovering from sleep debt, and individuals with illnesses."

**L1-2b (H for the abstract, full text not read).** Van Dongen, H. P. A., Maislin, G., Mullington, J. M., & Dinges, D. F. (2003). The cumulative cost of additional wakefulness: dose-response effects on neurobehavioral functions and sleep physiology from chronic sleep restriction and total sleep deprivation. *Sleep, 26*(2), 117-126. DOI 10.1093/sleep/26.2.117 (PMID 12683469).
- **What I read:** the MEDLINE abstract through the Europe PMC record (`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1093/sleep/26.2.117&resultType=core&format=json`).
- **Blocked:** `doi.org`, `academic.oup.com` and the OA PDF were `bot_blocked` or unreachable, so I cannot confirm the DOI resolves for a reader.
- **Design (abstract):** 48 healthy adults aged 21-38 in a lab, randomised to 4, 6 or 8 h time in bed per night for 14 days. A separate experiment used 3 nights without sleep.
- **Quotes (abstract):**
  - "Chronic restriction of sleep periods to 4 h or 6 h per night over 14 consecutive days resulted in significant cumulative, dose-dependent deficits in cognitive performance on all tasks. Subjective sleepiness ratings showed an acute response to sleep restriction but only small further increases on subsequent days, and did not significantly differentiate the 6 h and 4 h conditions."
  - "Since chronic restriction of sleep to 6 h or less per night produced cognitive performance deficits equivalent to up to 2 nights of total sleep deprivation, it appears that even relatively moderate sleep restriction can seriously impair waking neurobehavioral functions in healthy adults."
  - "Sleepiness ratings suggest that subjects were largely unaware of these increasing cognitive deficits".
- **Caveats:**
  - Time in bed was controlled in the lab. It was not self-chosen sleep.
  - "Up to 2 nights" is an upper bound for "6 h or less". The abstract does not say which condition matches it, so do not write that 6 h equals 2 nights awake.
  - The sleepiness finding is about self-ratings failing to separate 6 h from 4 h. It does not mean there was no impairment.
  - The Europe PMC record lists an erratum (*Sleep* 2004 Jun 15;27(4):600) and a comment (*Sleep* 2003;26(3):247-8). I read neither, so I do not know what the erratum corrects.

**L1-2c (H).** Pega, F., Náfrádi, B., Momen, N. C., Ujita, Y., Streicher, K. N., Prüss-Üstün, A. M., et al. (2021). Global, regional, and national burdens of ischemic heart disease and stroke attributable to exposure to long working hours for 194 countries, 2000-2016: A systematic analysis from the WHO/ILO Joint Estimates of the Work-related Burden of Disease and Injury. *Environment International, 154*, 106595. DOI https://doi.org/10.1016/j.envint.2021.106595.
- **Dates:** Europe PMC gives an e-publication date of 2021-05-17 and a print date of 2021 Sep. The Elsevier Pure page says "May 2021".
- **What I read:** `doi.org` led to a ScienceDirect captcha page. I read the open-access full text at https://pmc.ncbi.nlm.nih.gov/articles/PMC8204267/, the Europe PMC abstract, and the WHO release at https://www.who.int/news/item/17-05-2021-long-working-hours-increasing-deaths-from-heart-disease-and-stroke-who-ilo (17 May 2021 per its URL).
- **Quotes (abstract):**
  - "In 2016, 488 million people (95% uncertainty range: 472-503 million), or 8.9% (8.6-9.1) of the global population, were exposed to working long hours (≥55 hours/week). An estimated 745,194 deaths (705,786-784,601) and 23.3 million disability-adjusted life years (22.2-24.4) from ischemic heart disease and stroke combined were attributable to this exposure."
  - WHO release: "The study concludes that working 55 or more hours per week is associated with an estimated 35% higher risk of a stroke and a 17% higher risk of dying from ischemic heart disease, compared to working 35-40 hours a week."
- **Caveats:**
  - The 745,194 deaths are modelled population-attributable estimates. They are not counted deaths.
  - The paper's own limitation reads: "Evidence comes from observational studies, for which residual confounding cannot be ruled out, and we cannot be certain that a causal association exists". It rates the evidence "moderate quality".
  - In the paper's tables, the relative risk for ≥55 h/week versus 35-40 h is 1.17 (95% CI 1.05-1.31) for fatal ischemic heart disease. It is 1.35 (1.13-1.61) for non-fatal stroke, because stroke mortality evidence was rated "inadequate". The WHO sentence blends fatal and non-fatal outcomes.
  - Suggested wording (my inference): "is associated with higher risk of stroke and heart disease death", not "causes".

**L1-3a (H).** Rubinstein, J. S., Meyer, D. E., & Evans, J. E. (2001). Executive control of cognitive processes in task switching. *Journal of Experimental Psychology: Human Perception and Performance, 27*(4), 763-797. DOI https://doi.org/10.1037/0096-1523.27.4.763, which resolves to the PsycNet landing page (fetched).
- **Quotes (abstract):**
  - "In 4 experiments, participants alternated between different tasks or performed the same task repeatedly."
  - "Task alternation yielded switching-time costs that increased with rule complexity but decreased with task cuing. These factor effects were additive, supporting a model of executive control that has goal-shifting and rule-activation stages for task switching."
  - "It appears that rule activation takes more time for switching from familiar to unfamiliar tasks than for switching in the opposite direction."
- **Sample:** The APA press release of 5 Aug 2001 (https://www.newswise.com/articles/is-multitasking-more-efficient, fetched) says four experiments with young adults, "12, 36, 36 and 24 in number". The tasks were solving math problems or classifying geometric objects.
- **Release wording:** "Rule activation itself takes significant amounts of time, several tenths of a second -- which can add up when people switch back and forth repeatedly between tasks."
- **Caveats:**
  - The abstract reports no productivity percentage.
  - The costs were measured in short lab trials, not real workdays.
  - I did not read the full paper. The apa.org PDF was unreachable and Scribd was blocked.

**L1-3b (H).** American Psychological Association. "Multitasking: Switching costs." https://www.apa.org/topics/research/multitasking. The page footer reads "American Psychological Association, March 20, 2006" and "Date created: 2006".
- **Quotes:**
  - "Although switch costs may be relatively small, sometimes just a few tenths of a second per switch, they can add up to large amounts when people switch repeatedly back and forth between tasks."
  - "Thus, multitasking may seem efficient on the surface but may actually take more time in the end and involve more error."
  - "Meyer has said that even brief mental blocks created by shifting between tasks can cost as much as 40 percent of someone's productive time."
- **How hedged the 40 percent is:** It carries three hedges: "has said" (an attributed remark), "can cost as much as" (an upper bound), and "productive time" (not a task-level measure). The page's source list cites no paper reporting 40%.
- **Origin I found (M):** CNN, 5 Aug 2001 (https://edition.cnn.com/2001/CAREER/trends/08/05/multitasking.focus/), quoting Meyer: "Not being able to concentrate for, say, tens of minutes at a time, may mean it's costing a company as much as 20 to 40 percent" in potential efficiency lost. That is a range, an illustration ("say", "may mean"), and workplace-level, not an experimental result.
- **What the research did not measure:**
  - Neither the abstract nor the APA press release contains a 40% figure.
  - The experiments timed switch costs of fractions of a second to a few tenths of a second per switch.
  - They did not measure share of workday lost, real office interruptions, or long-run output.
  - Because I did not read the full paper, I cannot say the figure is absent from it.
- **Safe wording (inference):** "psikolog David Meyer pernah menyebut bahwa jeda mental singkat akibat berganti tugas bisa memakan hingga 40 persen waktu produktif (APA)", clearly marked as his estimate. Otherwise cite only the measured result: switching costs rise with task complexity and unfamiliarity.

**Not read:**
- Not read: Weick 1984 full text on PsycNet (landing page and abstract only; the full text came from a third-party PDF copy).
- Not read: HBR 2011 article body (paywalled; only the summary was visible).
- Not read: Van Dongen 2003 full text (`doi.org`, `academic.oup.com` and the OA PDF were bot-blocked or unreachable).
- Not read: Van Dongen erratum (*Sleep* 2004;27(4):600) and comment (*Sleep* 2003;26(3):247-8) (listed in the Europe PMC record, not opened).
- Not read: JCSM full text of Watson 2015 (paywalled preview; the statement body came from the *Sleep* version on PMC).
- Not read: ScienceDirect page for Pega 2021 (captcha; read via PMC instead).
- Not read: Rubinstein 2001 full text (apa.org PDF unreachable, Scribd client-challenge).
- Not read: PubMed pages (cookie wall), Wiley review of the progress-principle book (bot_blocked), td.org (HTTP 429), dokumen.pub HBR reprint (bot_blocked).
- Not read: other search hits not opened (ResearchGate, Semantic Scholar, WHO Q&A page, CDC stacks, blogs and social posts).

Mischel (1989), Watts and colleagues (2018), the Fed's $400 figure, opportunity cost and diversification are all confirmed from pages I fetched. The OJK emergency-fund amount is not confirmed, because `sikapiuangmu.ojk.go.id` blocked every fetch. The IDX page and the study on returns to training also failed, so there is no verified IDX source and no verified training study. All fetches were done 2026-10-23.

I used 24 tool calls, one past your call-23 report point and inside the cap of 25. The extra call was a local extraction from a saved fetch result. No instructions were found inside any fetched page.

**L2-1a (H). Mischel, W., Shoda, Y., & Rodriguez, M. L. (1989). "Delay of gratification in children." Science, 244(4907), 933-938. DOI 10.1126/science.2658056.**
- URL fetched: https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:2658056%20AND%20SRC:MED&resultType=core&format=json
- That is the Europe PMC record, which mirrors the PubMed abstract. The Science page, the PubMed page and the PsycNet record all failed (see Not read).
- Finding: the abstract says 4-year-olds who waited longer in lab delay tasks later became more competent adolescents. It also says specific cognitive and attentional processes make self-control possible.
- Quotes:
  - "Those 4-year-old children who delayed gratification longer in certain laboratory situations developed into more cognitively and socially competent adolescents, achieving higher scholastic performance and coping better with frustration and stress."
  - "To function effectively, individuals must voluntarily postpone immediate gratification and persist in goal-directed behavior for the sake of later outcomes."
- Caveats:
  - Europe PMC types it as "Review, Journal Article". It summarises a research program rather than reporting one new experiment.
  - The abstract gives no sample size or effect size, and does not mention marshmallows.
  - The Watts abstract names Shoda, Mischel & Peake (1990) as the study it replicated. I did not fetch that paper.
  - The third author appears as "Rodriguez MI" in Europe PMC and "Rodriguez, M. L." in the PsycNet and SCIRP search snippets. I would use "M. L." but have not checked it against the print byline.

**L2-1b (H). Watts, T. W., Duncan, G. J., & Quan, H. (2018). "Revisiting the marshmallow test: A conceptual replication investigating links between early delay of gratification and later outcomes." Psychological Science, 29(7), 1159-1177. DOI 10.1177/0956797618761661.**
- URLs fetched: https://psycnet.apa.org/record/2018-35625-013 (citation and abstract); https://www.psychologicalscience.org/publications/observer/obsonline/a-new-approach-to-the-marshmallow-test-yields-complex-findings.html (APS Observer, published 2018-06-05, M).
- Finding: the association is about half the size of the original, and about two thirds of it goes away once family background, early cognitive ability and the home environment are controlled. Behavioural outcomes were barely related.
- Quotes (PsycNet abstract):
  - "an additional minute waited at age 4 predicted a gain of approximately one tenth of a standard deviation in achievement at age 15. But this bivariate correlation was only half the size of those reported in the original studies and was reduced by two thirds in the presence of controls for family background, early cognitive ability, and the home environment."
  - "Most of the variation in adolescent achievement came from being able to wait at least 20 s."
  - "Associations between delay time and measures of behavioral outcomes at age 15 were much smaller and rarely statistically significant."
- Quotes (APS Observer):
  - "Mischel and his colleagues have always said that tests with a larger sample of children might yield smaller effect sizes, and that the home environment could influence academic outcomes more than what the tests could show."
  - Watts: "an intervention that alters a child's ability to delay, but fails to change more general cognitive and behavioral capacities, will probably have very small effects on later outcomes."
- Caveats:
  - It is a conceptual replication, not a direct one. It uses a larger dataset (NICHD SECCYD, more than 900 children), and its main analysis is of children whose mothers had not completed college.
  - APS says Hispanic children were still underrepresented. APS also says children counted as delaying if they waited 7 minutes, against up to 20 minutes in Mischel's sample.
  - The APS Observer says the association "disappeared" after controls. The abstract says "reduced by two thirds". Use the abstract wording, because "disappeared" overstates it.
  - The PMC copy returned only a title. The SAGE page was blocked.

**L2-2a (U for the OJK amount). OJK emergency-fund (dana darurat) recommendation by household type.**
- I could not fetch `sikapiuangmu.ojk.go.id`. Both `https://sikapiuangmu.ojk.go.id/` and `/FrontEnd/CMS/Home` returned HTTP 403, and a domain-filtered search found no article page there.
- Do not cite any OJK multiplier yet. Claims that "OJK says 3-6x for singles, 6-12x for families" appeared only in Instagram search snippets, which I did not fetch. Commercial pages (Manulife, Allianz, Pegadaian, Bank Sinarmas) disagree on the married-with-children band (9-12x versus 6-12x), also from snippets only.
- What I did read from OJK:
  - OJK Majalah Edukasi Konsumen, Triwulan IV 2025 (Desember 2025), https://www.ojk.go.id/id/Publikasi/E-Magazine/Documents/Majalah%20Edukasi%20Konsumen%20Triwulan%20IV%202025.pdf (H for what it says, no amount). Dana darurat appears only twice: one is in text about Ratu Maxima's visit (the agenda lists "perencanaan jangka panjang, dana darurat, dan perlindungan dari pinjaman online"), the other is a savings-account tip. Quote: "tabungan biasa memberikan fleksibilitas penuh untuk transaksi harian dan dana darurat." The PDF text extraction lowercases the words.
  - OJK press release SP 167/DKPU/OJK/IX/2026, 9 Sep 2026, https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Gelar-LIKE-IT-di-Provinsi-Banten.aspx (H). The "dana darurat" and "uang dingin" lines are from a DPR Komisi XI member (Annisa M. A. Mahesa), not from OJK.
- Next step: fetch `sikapiuangmu.ojk.go.id` through a browser session, or an OJK PDF such as a financial-planning booklet.

**L2-2b (M). Indonesian fallback for "minimum 3 months". Kemenkeu DJKN (KPKNL Lahat), "Investasi Bagi Orang Berpenghasilan Tetap", dated Rabu, 06 Mei 2026, author shown as "N/a".**
- URL: https://www.djkn.kemenkeu.go.id/kpknl-lahat/baca-artikel/18366/Investasi-Bagi-Orang-Berpenghasilan-Tetap.html
- Quote: "Pastikan Anda memiliki dana darurat minimal 3 bulan pengeluaran, asuransi dasar berupa asuransi kesehatan atau asuransi jiwa. Sebaiknya investasi dilakukan setelah kebutuhan dasar ini terpenuhi."
- Caveats: this is a regional Ministry of Finance office article, not a policy document and not OJK. It is written for fixed-salary earners and gives only a floor, with no band by household type.

**L2-2c (H). Federal Reserve Board, "Economic Well-Being of U.S. Households in 2025", from the Survey of Household Economics and Decisionmaking (SHED), fielded October 2025. Press release 13 May 2026.**
- URLs: https://www.federalreserve.gov/newsevents/pressreleases/other20260513a.htm and the data table https://www.federalreserve.gov/consumerscommunities/sheddataviz/unexpectedexpenses-table.html
- Finding: in the 2025 survey, 63 percent of US adults would cover a $400 emergency expense using cash or its equivalent. The share was 63 percent in 2022, 2023, 2024 and 2025, up from 50 percent in 2013 and a high of 68 percent in 2021. Rechecked 2026-10-24: the yearly series (2013 to 2025) is in the data table only; the press release states only the 63 percent figure, unchanged from 2024. ch05 cites only the press release, so it gives only that figure.
- Quote (press release): "The share who would cover a $400 emergency expense using cash or its equivalent also remained unchanged from 2024 at 63 percent."
- Quote (table header): "Would cover a $400 emergency expense completely using cash or its equivalent."
- Table breakdowns for 2025: less than high school 26 percent, bachelor's or more 81, ages 18-29 45, parents with children under 18 55, non-metro 59.
- Supporting page, St. Louis Fed, Page One Economics, Sept 2025 (M): https://www.stlouisfed.org/publications/page-one-economics/2025/sep/when-unexpected-happens-be-ready-with-emergency-fund. Quotes: "The 2024 SHED survey found that 55 percent of respondents said they had set aside money for 3 months of expenses in an emergency savings fund" and "30 percent of adults said they could not cover 3 months of expenses by any means."
- Caveats: the measure is a hypothetical, self-reported $400 expense, among all US adults. It does not measure income volatility, farmers or Indonesia. Say "US adults" and "2025" in the text. I did not read the full report.

**L2-3a (M). Opportunity cost, textbook-level.**
- Econlib (Library of Economics and Liberty), "Opportunity Cost", quoting the Concise Encyclopedia of Economics (page metadata date 2018-06-01): https://www.econlib.org/library/Topics/College/opportunitycost.html
  - Quote: "When economists refer to the 'opportunity cost' of a resource, they mean the value of the next-highest-valued alternative use of that resource."
- Federal Reserve Bank of St. Louis, "Real-Life Examples of Opportunity Cost" (page shows June 03, 2026, updated from a post of January 29, 2020): https://www.stlouisfed.org/open-vault/2020/january/real-life-examples-opportunity-cost
  - Quote: "Opportunity cost is the value of the next-best alternative when a decision is made; it's what is given up." This is attributed to Andrea Caceres-Santamaria, "Money and Missed Opportunities", Page One Economics, Oct 2019.
  - It has a farm example: "A farmer decides to plant wheat. The opportunity cost represents: Alternative crops the farmer could have planted (corn, soybeans, etc.); Different uses for land and farm equipment".
  - It also says: "The excitement of consuming today is valued significantly more than the thought of consuming in the future." This ties to ch04.
- Investopedia (Jason Fernando, metadata date 2003-11-24): https://www.investopedia.com/terms/o/opportunitycost.asp
  - Quote: "Opportunity cost is the value of the next-best alternative you didn't choose."
  - It cautions that comparing returns without risk "can be misleading".
- Caveats: the St. Louis Fed illustrations are explicitly "for illustrative purposes only", with 3 percent interest and no inflation or tax. The Investopedia formula is a forward-looking estimate, not accounting profit.

**L2-3b (U). Returns to training or tools for workers.**
- McKenzie, D. (2017). "How Effective Are Active Labor Market Policies in Developing Countries? A Critical Review of Recent Evidence." World Bank Research Observer 32(2), 127-154.
- I fetched https://documents.worldbank.org/en/publication/documents-reports/documentdetail/256001490191438119, but it returned only the page title and the opening line "Jobs are the number one policy concern of policy makers in many countries." The abstract's findings were not read.
- A ResearchGate search snippet says the review found "modest average effects" of vocational training. That is a secondary snippet only, so do not rely on it.
- The paper concerns vocational training and labour market programs, not small-farmer tools. I recommend skipping it unless you want the abstract fetched from IZA DP 10655 or OpenKnowledge.

**L2-4a (M). Start simple, "high risk high return". Kemenkeu DJKN (KPKNL Lahat), 6 May 2026, same page as L2-2b.**
- Quote on risk: "Tapi ingat bentuk investasi yang keuntungan tinggi tersebut risikonya juga tinggi. Pilihlah instrumen investasi sesuai dengan kenyamanan anda terhadap risiko."
- Quote on starting small: "Mulailah berinvestasi pada instrumen yang sederhana seperti reksa dana pasar uang, reksa dana pendapatan tetap atau emas digital. Seiring waktu dan pengalaman anda bisa mencoba instrumen yang lebih berisiko seperti saham."
- Quote on diversification: "jangan menaruh semua dana di satu jenis investasi, artinya kalau satu bentuk invesati mengalami kegagalan, masih ada dana dalam bentuk invesati lain yang aman." The source misspells "investasi" as "invesati"; quote it with [sic] or paraphrase.
- Caveats: this is an official government page but an informal regional article with no author. It is not OJK or IDX. It gives no nominal minimum amount.

**L2-4b (H). OJK press release SP 167/DKPU/OJK/IX/2026, 9 Sep 2026** (URL as in L2-2a).
- Quote (OJK's own summary of its position): "Masyarakat juga diimbau untuk mampu membedakan antara kebutuhan dan keinginan serta memulai investasi sedini mungkin."
- Quote (DPR member Annisa M. A. Mahesa, not OJK): "dana yang digunakan untuk berinvestasi adalah uang dingin."
- Caveats: it supports "start early" and "build the foundation first", but not "high risk high return" or small nominal amounts. It reports SNLIK 2026 financial literacy of 69,57 percent, which could serve as context.

**L2-4c (H). SEC Office of Investor Education and Advocacy, investor.gov, "Diversify Your Investments"** (no page date shown).
- URL: https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/diversify-your-investments
- Quotes: "Diversification can be neatly summed up as, 'Don't put all your eggs in one basket.' The idea is that if one investment loses money, the other investments will make up for those losses. Diversification can't guarantee that your investments won't suffer if the market drops. But it can improve the chances that you won't lose money, or that if you do, it won't be as much as if you weren't diversified."
- Glossary page (https://www.investor.gov/introduction-investing/investing-basics/glossary/diversification): "The strategy involves spreading your money among various investments in the hope that if one loses money, the others will make up for those losses."
- Caveats: this is a US regulator and the page is generic. Its own caveat, "can't guarantee", is worth keeping.

**Strong Indonesian leads, not yet read (U):** search snippets only.
- OJK Majalah Edukasi Konsumen Triwulan III 2023, which says "Diversifikasi adalah salah satu kunci penting dalam manajemen risiko investasi."
- Bank Indonesia, Modul 4 Edukasi Keuangan Digital, which says "Mulai berinvestasi dari nilai yang kecil dan pahami risiko investasi" and "jangan simpan telur dalam satu keranjang".
- OJK Buku Saku Pasar Modal 2025.
- All three need a single-URL fetch. A bundled PDF fetch timed out.

**Not read:**
- Not read: science.org Mischel page (bot_blocked)
- Not read: PubMed 2658056 page (cookie wall)
- Not read: PsycNet Mischel record (empty_content)
- Not read: SAGE Watts abstract page (bot_blocked)
- Not read: PMC6050075 (title only)
- Not read: UW Shoda lab PDF (no text returned)
- Not read: `sikapiuangmu.ojk.go.id`, two URLs (HTTP 403)
- Not read: idx.co.id/id/produk/saham (bot_blocked)
- Not read: x.com sikapiuangmu post (timed out in a bundle, not retried)
- Not read: OJK Majalah Edukasi Konsumen Triwulan III 2023 PDF (timed out)
- Not read: BI Modul 4 PDF (timed out)
- Not read: OJK Buku Saku Pasar Modal 2025 (not fetched)
- Not read: McKenzie 2017 abstract proper, from IZA, OUP or OpenKnowledge (not fetched)
- Not read: Shoda, Mischel & Peake 1990 (not fetched)
- Not read: Fed SHED 2025 full report text (only the press release and data table)
- Not read: CFPB, FINRA (not searched or fetched)
- Not read: Instagram and commercial pages on emergency-fund multipliers (snippets only)

## 5. Set L4 and L3, game metadata and lesson sources for chapters 08-13

Researcher report, kept verbatim except ID prefixes and headings.

**Summary.** Everything the brief asked for was read, with caveats on three points.

- **NA release day:** sources disagree (Nov 22 vs Nov 30, 2000), so prose should say "November 2000".
- **Delegation source:** the HBR article could not be read, so L4-2b is an HBS Online piece instead.
- **Prima guide year:** every bibliographic record says 2000. The scan's copyright line says 2000-2004.

Access date for every item is 2026-10-23, and 25 of the 28 tool calls were used. Page text came through `fetch_content`, except where a result was too large and I read the saved copy with Python. Quotes taken from the guide's OCR text have line-break hyphens repaired by me.

**L4-1a (H for JP data and Natsume as NA publisher, M for the NA day).** Harvest Moon: Back to Nature, PlayStation.
- **URLs fetched:**
  - https://en.wikipedia.org/w/index.php?title=Harvest_Moon:_Back_to_Nature&action=raw
  - https://ja.wikipedia.org/wiki/牧場物語_ハーベストムーン
  - https://www.bokumono.com/sub/harvest.php (Marvelous's official series site)
  - https://gamefaqs.gamespot.com/ps/446412-harvest-moon-back-to-nature/data
  - https://archive.org/details/psx_harvmoon
- **Japanese title:** 牧場物語～ハーベストムーン～ (Bokujō Monogatari Hābesuto Mūn). The official site writes 牧場物語 ～ハーベストムーン.
- **Developer:** Victor Interactive Software, per en and ja Wikipedia, the MobyGames metadata copied on archive.org, and the guide's copyright page.
- **Japan release:** 16 December 1999, all five sources agree.
- **North America:** published by Natsume (SLUS-01115). The infobox wikitext gives NA 22 Nov 2000 and EU 26 Jan 2001.
- **Quotes:**
  - en Wikipedia: "is a 1999 video game in the farm simulation series Story of Seasons developed by Victor Interactive Software and published outside of Japan by Natsume."
  - Official site: "発売日：1999/12/16 機　種：PlayStation"
  - ja Wikipedia: "1999年12月16日にビクターインタラクティブソフトウェアが発売したPlayStation用シミュレーションゲームである。"
- **Date disagreement (NA):**
  - Wikipedia and GameFAQs say 22 Nov 2000.
  - MobyGames (via archive.org item psx_harvmoon) says "Released Nov 30, 2000". The same item's own publication date is 2000-11-17.
  - A GameFAQs user FAQ snippet (not fetched) says 11 Nov 2000.
  - Prose should say "November 2000".
- **Caveats:**
  - GameFAQs and a search snippet from a Japanese wiki list the developer as TOSE. I did not verify what TOSE did, so it may be a subcontractor.
  - The IGN and GameSpot reviews I read are dated 27 Nov and 15 Dec 2000 and give no release date.
  - I found no usable Natsume official page. Marvelous's site covers Japan only.

**L4-1b (H, with a wording caveat).** Yasuhiro Wada as series creator.
- **URLs fetched:**
  - https://www.gamedeveloper.com/business/harvest-man-yasuhiro-wada-s-gentle-world
  - https://en.wikipedia.org/wiki/Yasuhiro_Wada_(video_game_designer)
- **Finding:** Brandon Sheffield's Gamasutra interview (page date 3 Dec 2007) calls Wada the series creator. Wada says his first game concept was Harvest Moon, and the same interview says Marvelous bought Victor Interactive in 2003.
- **Quotes:**
  - "Gamasutra speaks to series creator and Marvelous Interactive president Yasuhiro Wada"
  - "My first game concept was Harvest Moon"
- **Disagreement on his role:**
  - The en Wikipedia game page lists him as Producer only (directors are Kisaki, Kurouta, Kaizuki, Oritake).
  - His own Wikipedia page lists "Director, producer" for this game.
  - Safe wording: "produser, pencipta seri (Gamasutra, 2007)".

**L4-1c (H).** Debra McBride and David Cassady, *Harvest Moon: Back to Nature: Prima's Official Strategy Guide*. Roseville, CA: Prima Games (a division of Random House), 2000, 128 pages, paperback. ISBN-10 0761532714, ISBN-13 978-0761532712.
- **URLs fetched:**
  - https://isbn.nu/9780761532712
  - https://openlibrary.org/isbn/9780761532712.json
  - The djvu text of the archive.org scan (below)
- **Quotes from the scan's credits page:**
  - "Prima Games A Division of Random House, Inc."
  - "ISBN: 7615-3271-4"
  - "©2000-2004 Natsume Inc. ©2000-2004 Victor Interactive Software"
- **Date disagreement:** isbn.nu gives 6 Nov 2000, Open Library 7 Nov 2000, an Amazon.de snippet 1 Oct 2000, and an ACM DL snippet 1 Nov 2000. The scan's own copyright line reads "© 2000-2004 by Prima Publishing", so the year is safest as "2000".
- **Caveat:** eBay spells the co-author "Cassidy", which is wrong against the title page. I did not open the ACM, Amazon.de, AbeBooks or Goodreads pages.

**L4-1d (H).** Archive.org item.
- **URLs fetched:**
  - https://archive.org/details/docslide.net_harvest-moon-back-to-nature-prima-official-eguidepdf (body was only a donation banner)
  - https://archive.org/metadata/docslide.net_harvest-moon-back-to-nature-prima-official-eguidepdf
  - the item's `_djvu.txt` file
- **Item title:** metadata title is "Harvest Moon Back To Nature Strategy Guide Official eBook in PDF Format". The page `<title>` adds " : Free Download, Borrow, and Streaming : Internet Archive". Uploaded 2018-09-29, 127 scanned pages, collection `strategyguides`.
- **Content check:** the OCR text opens with the cover and credits of the Prima guide above, so the item is that book.
- **Caveat:** it is a user-uploaded scan of a copyrighted guide. Cite the book and treat the link as a convenience, because it could be taken down.

**L4-2a (H).** Whillans, A. V., Dunn, E. W., Smeets, P., Bekkers, R., & Norton, M. I. (2017). Buying time promotes happiness. *PNAS, 114*(32), 8523-8527. https://doi.org/10.1073/pnas.1706541114
- **URLs fetched:**
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC5559044/ (full text)
  - the Europe PMC REST record for PMID 28739889
  - https://www.hbs.edu/faculty/Pages/item.aspx?num=52953
- **Finding:**
  - Surveys: n = 6,271 across the US, Canada, Denmark and the Netherlands. Across the first six samples (n = 4,469), 28.2% spent money to buy time and reported higher life satisfaction (d = 0.24, 95% CI 0.18 to 0.31).
  - Field experiment: 60 working adults in Vancouver spent $40 on a time-saving purchase one weekend and $40 on a material purchase the next. End-of-day positive affect was 4.00 vs 3.71 (P = 0.007, d = 0.33), and time stress was lower after the time-saving purchase (d = 0.36).
- **Quotes:**
  - "using money to buy time can provide a buffer against this time famine, thereby promoting happiness."
  - "paying to delegate common household chores, like cleaning, shopping, and cooking" (I trimmed the sentence around a source dash)
  - "Ironically, spending too much money on time-saving services could undermine perceptions of personal control, by leading people to infer that they are unable to handle any daily tasks, potentially reducing well-being."
- **Date disagreement:** online 24 Jul 2017 (Europe PMC), issue dated Aug 2017 (HBS lists 8 Aug 2017). Cite as 2017.
- **Caveats:**
  - The paper tests paying others with money, not delegating to subordinates or helpers paid in gifts.
  - The causal evidence is one two-weekend experiment with n = 60. The survey link is correlational.
  - The PNAS and PubMed pages themselves were blocked. The PMC copy is the full text, and the abstract matches the two other records.

**L4-2b (M).** Landry, Lauren. "How to Delegate Effectively: 9 Tips for Managers." Harvard Business School Online, 14 Jan 2020 (updated 2 Jun 2021). https://online.hbs.edu/blog/post/how-to-delegate-effectively
- **Finding:** managers must supply training and resources, and early delegated work runs slower before speeding up. It also lists lack of trust in the delegate as a reason managers avoid delegating.
- **Quotes:**
  - "If the person you’re delegating work to needs specific training, resources, or authority to complete the assigned project, it’s your role as a manager to provide all three."
  - "a task you can complete in 30 minutes might take an employee a full hour the first time they complete it."
  - "As you continue to delegate and your employees become more familiar with the tasks that need to be completed, you’ll notice that the work will get done faster over time."
- **Caveats:** this is an HBS Online blog, not an HBR article. The HBR page I fetched (https://hbr.org/2026/10/our-favorite-management-tips-on-delegating, 22 Oct 2026) returned only its summary, so I rate it U. The HBS post also repeats a Gallup claim ("33 percent higher revenue") with no link, which I would not use.

**L4-3a (H).** Buehler, R., Griffin, D., & Ross, M. (1994). Exploring the "planning fallacy": Why people underestimate their task completion times. *Journal of Personality and Social Psychology, 67*(3), 366-381. https://doi.org/10.1037/0022-3514.67.3.366
- **URL fetched:** https://psycnet.apa.org/record/1995-04284-001 (APA record with full abstract).
- **Finding:** five studies, 465 undergraduates. Predictions were too optimistic because people focus on plan-based scenarios, and the bias vanished when they were told to link their predictions to relevant past experiences.
- **Quotes:**
  - "Ss' predictions of their completion times were too optimistic for a variety of academic and nonacademic tasks."
  - "The optimistic bias was eliminated for Ss instructed to connect relevant past experiences with their predictions."
- **Caveat:** this is the abstract only. The study covers time estimates, not physical fatigue or irreversible choices.

**L4-3b (H).** Arkes, H. R., & Blumer, C. (1985). The psychology of sunk cost. *Organizational Behavior and Human Decision Processes, 35*(1), 124-140. https://doi.org/10.1016/0749-5978(85)90049-4
- **URL fetched:** https://psycnet.apa.org/record/1985-20101-001 (APA record with full abstract).
- **Finding:** the field study had 54 subjects with theatre season tickets. Those who paid more attended more plays over the next six months. The authors tie the effect to not wanting to appear wasteful.
- **Quotes:**
  - "The sunk cost effect is manifested in a greater tendency to continue an endeavor once an investment in money, effort, or time has been made."
  - "the psychological justification for this behavior is predicated on the desire not to appear wasteful."
  - "people will throw good money after bad"
- **Caveat:** abstract only, because the ScienceDirect page was blocked. The paper does not study irreversibility. Linking it to the one-way mine descent is the book's analogy, not the paper's finding.

**L4-4 (H for the guide text, bonus on game mechanics from the scan in L4-1d).** These bear on the ch12 and ch13 premises.
- **Mine, cannot go back up.** Confirmed: after descending a level the player "cannot climb back to the previous floor"; exit is still possible by a ladder or the door at the top.
- **Basket and tiredness.** The guide says to take the Basket into the mine and keep mining until it holds 30 pieces of ore or the character is too tired to continue (paraphrased).
- **Fainting.** The guide says fainting from overwork sends you to the Clinic. en Wikipedia adds that working past depleted energy ends in blackout and hospitalization, and that "Time passes while the player is outdoors, and pauses inside different buildings such as shops or barns and mines."
- **Harvest Sprites.** After working for the player for a while, the guide says, they can handle most daily chores on their own (paraphrased). They work in return for a small gift each working day. You choose one day, three days or a week, and the guide says a single day gives you more control.
- **"After training" wording.** Neither the guide nor ja Wikipedia describes a training action. ja Wikipedia says they start unreliable and improve as they do work: 「最初は頼りないが、仕事をこなせば徐々に上手くなっていく」. I would write "improve with use" in ch12.
- **ja Wikipedia on the mines.** It calls them 鉱石場 (ore fields) and says one is open only in winter. The guide describes floors, holes and ladders, so check which one ch13 follows.

Not read: PNAS article page (bot_blocked)
Not read: PubMed page for PMID 28739889 (cookie wall)
Not read: ScienceDirect page for Arkes and Blumer (bot_blocked)
Not read: ADS abstract page for Whillans (bot_blocked)
Not read: dl.acm.org guide record (bot_blocked, used the search snippet only)
Not read: HBR "Our Favorite Management Tips on Delegating Effectively" (summary only, body paywalled)
Not read: Europe PMC fullTextXML endpoint (HTTP 500; used PMC instead)
Not read: Natsume official page and MobyGames page (no usable official page found, MobyGames only via the archive.org copy)
Not read: Whillans SI Appendix (not fetched)
Not read: AbeBooks, Amazon.de, Goodreads, eBay and StoryGraph guide listings (search snippets only)
Not read: GameFAQs user FAQ with "November 11 2000", archive.thegia.com, Behavioral Scientist, ScienceDaily (search snippets only)
Not read: Wikipedia "Story of Seasons" page, Nintendojo, Kikizo and Zelda Dungeon Wada interviews (not needed)

I read all four topics. Two sources are only partly confirmed: the Hall (2019) hour estimates come from secondary pages, and Zajonc's DOI was not checked. Access date for everything is 2026-10-23. I used 21 of 25 tool calls.

**L3-1 (H) habits, ch08.** Lally P, van Jaarsveld CHM, Potts HWW, Wardle J (2010). "How are habits formed: Modelling habit formation in the real world." *European Journal of Social Psychology* 40(6), 998-1009. DOI 10.1002/ejsp.674. Published online 16 July 2009, in print October 2010.
- **URLs read:** Wiley abstract page https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674. Full text from a third-party-hosted journal PDF, https://emotionalfirstaidacademy.com/wp-content/uploads/2023/10/How-habits-are-formed.pdf. Its abstract matches Wiley's word for word and it carries the journal's DOI footer.
- **Sample:** 96 volunteers enrolled, 14 dropped out, 82 gave enough data. Mean age 27, range 21-45, mostly postgraduate students, 30 men and 66 women. They were paid £30 for completing the study.
- **Design:** each person chose an eating, drinking or exercise behaviour and did it daily after a cue for 84 days. They rated automaticity daily on 7 items of the self-report habit index (0-42).
- **Curve fits:** a curve fitted 62 of the 82 people and fitted "well" for 39 (48% of 82).
- **Median days to automaticity:** 66 days to reach 95% of each person's plateau, among those 39 only (quartiles 39-102). The range was 18 to 254 days. The paper calls this the "modelled time to plateau", and many estimates ran past the 84 observed days.
- **By behaviour (n=39):** eating 65 days, drinking 59, exercise 91. The paper says exercise took "one and a half times longer", but the difference was not significant (p = .328) and the study was not powered for subgroups.
- **Missing one day:** the paper identified 140 single missed opportunities across 55 participants. Automaticity dropped on average 0.29 points the next day. Comparing two-day changes, the average gain was 0.79 points with no miss and 0.55 with a miss, a non-significant difference.
- **Quotes:**
  - "The time it took participants to reach 95% of their asymptote of automaticity ranged from 18 to 254 days; indicating considerable variation in how long it takes people to reach their limit of automaticity and highlighting that it can take a very long time."
  - "Missing one opportunity to perform the behaviour did not materially affect the habit formation process."
  - "The median time to reach 95% of asymptote was 66 days, with a range from 18 to 254 days."
- **Caveats:**
  - Do not write "everyone needs 66 days". It is a median for the 39 good-fit participants.
  - The authors say they measured "automaticity for performing these behaviours rather than specifically habit".
  - The measure is self-report, and the paper says "approximately half did not perform the behaviour consistently enough to achieve habit status".
  - The missed-day result covers single misses only. The paper's remark that a missed week hurts comes from another study (Armitage 2005), not from its own data.
  - The study has no control group, and I cannot confirm the participants' country from what I read.
- **Secondary pages that agree:** BPS Research Digest (Christian Jarrett, 6 Oct 2010), https://www.bps.org.uk/research-digest/how-form-habit (M). Hreha's critique (2026-02-09), https://www.thebehavioralscientist.com/articles/how-long-to-form-a-habit (M).

**L3-2 (H) social life and wellbeing, ch09.** Holt-Lunstad J, Smith TB, Layton JB (2010). "Social Relationships and Mortality Risk: A Meta-analytic Review." *PLoS Medicine* 7(7): e1000316. DOI 10.1371/journal.pmed.1000316. Published 27 July 2010, open access.
- **URL:** https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316 (full text read).
- **Headline numbers:** 148 studies, 308,849 participants. Pooled OR = 1.50 (95% CI 1.42 to 1.59), which the authors call "a 50% increased likelihood of survival for participants with stronger social relationships".
- **Participants and follow-up:** average age 63.9 at start, 49% female. Follow-up averaged 7.5 years (SD 7.1, range 3 months to 58 years). Sources were 51% North America, 37% Europe, 11% Asia, 1% Australia.
- **By measure type:** complex social integration measures gave OR 1.91 (1.63-2.23). Living alone versus with others gave OR 1.19 (0.99-1.44).
- **Quotes:**
  - "Across 148 studies (308,849 participants), the random effects weighted average effect size was OR = 1.50 (95% CI 1.42 to 1.59), indicating a 50% increased likelihood of survival for participants with stronger social relationships."
  - "The magnitude of this effect is comparable with quitting smoking and it exceeds many well-known risk factors for mortality."
- **Caveats:**
  - The studies are observational. The paper says "causality is not easily established. One cannot randomly assign human participants to be socially isolated".
  - 50% is the authors' reading of an odds ratio, so "50% greater odds" is the safer wording.
  - Participants skewed older, and 76% of the data came from North America and Europe.

**L3-2b (M) Harvard Study of Adult Development, ch09 optional.** Harvard Gazette, 11 April 2017 (page metadata `article:published_time` 2017-04-11T20:25:18+00:00, fetched 2026-10-24; the body text shows no date). Fetched page title: "Over nearly 80 years, Harvard study has been showing how to live a healthy and happy life". The search listing shows the title as "Good genes are nice, but joy is better". The page metadata gives the author as Liz Mineo (fetched 2026-10-24); the body text shows no byline.
- **URL:** https://news.harvard.edu/gazette/story/2017/04/over-nearly-80-years-harvard-study-has-been-showing-how-to-live-a-healthy-and-happy-life/
- **Facts:** the study began in 1938 with 268 Harvard sophomores. The Gazette says a 1970s group of 456 Boston inner-city residents (the Glueck Study) was also enlisted, and later offspring and wives.
- **Quotes:**
  - "The surprising finding is that our relationships and how happy we are in our relationships has a powerful influence on our health" (Robert Waldinger).
  - "Close relationships, more than money or fame, are what keep people happy throughout their lives, the study revealed."
  - "The people who were the most satisfied in their relationships at age 50 were the healthiest at age 80."
- **Caveats:**
  - This is Harvard's own news office reporting on the study, not the study's papers, so M and not H.
  - The Gazette says "strong correlation", and the original cohort was Harvard men plus Boston inner-city men.
  - "Loneliness kills. It's as powerful as smoking or alcoholism" is Waldinger's spoken line, not a measured result.
  - The official site https://www.adultdevelopmentstudy.org/ loaded but had no quotable claim, only links to talks and interviews.

**L3-3 (H, abstract only) unemployment, ch10.** Paul KI, Moser K (2009). "Unemployment impairs mental health: Meta-analyses." *Journal of Vocational Behavior* 74(3), 264-282. DOI 10.1016/j.jvb.2009.01.001. The DOI is printed in the PsycNet citation line.
- **URL:** https://psycnet.apa.org/record/2009-06258-005 (abstract and citation read). Full text was not readable.
- **Finding:**
  - The meta-analysis covers 237 cross-sectional and 87 longitudinal studies, with an average overall effect of d = 0.51.
  - Among the unemployed, 34% had psychological problems, against 16% of employed people.
  - Men and blue-collar workers were hit harder. Effects were stronger where unemployment protection was weak or income was unequal.
- **Quotes:**
  - "The average number of persons with psychological problems among the unemployed was 34%, compared to 16% among employed individuals."
  - "Meta-analyses of longitudinal studies and natural experiments endorsed the assumption that unemployment is not only correlated to distress but also causes it."
  - "We also identified mental-health related selection effects during job loss and job search, but they are weak."
- **Caveats:**
  - I read only the abstract, not the methods.
  - It is a population-level average, not a statement about any one person.
  - The abstract notes the causal claim rests on longitudinal studies and natural experiments, and that selection effects exist but are weak.
  - A search snippet (not fetched) says the studies were published 1963-2004.

**L3-3b (H, abstract only) perspective taking, ch10 optional.** Galinsky AD, Moskowitz GB (2000). "Perspective-taking: Decreasing stereotype expression, stereotype accessibility, and in-group favoritism." *Journal of Personality and Social Psychology* 78(4), 708-724.
- **DOI:** Europe PMC lists it as 10.1037//0022-3514.78.4.708 (the old double-slash form). I infer the standard form is 10.1037/0022-3514.78.4.708 but did not see it.
- **URL:** Europe PMC REST record for PMID 10794375 (abstract), https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:10794375%20AND%20SRC:MED&resultType=core&format=json
- **Finding:** three experiments. In Experiment 1, perspective-taking reduced stereotyping on both a conscious and a nonconscious task. In Experiment 2, it also increased overlap between self and elderly representations. In Experiment 3, it reduced in-group bias in a minimal-group setup.
- **Quotes:**
  - "In Experiment 1, perspective-taking decreased stereotypic biases on both a conscious and a nonconscious task."
  - "In Experiment 3, perspective-taking reduced evidence of in-group bias in the minimal group paradigm by increasing evaluations of the out-group."
- **Caveats:**
  - The tasks are laboratory stereotype and in-group tasks, not unemployment.
  - Using it to argue "imagine the jobless neighbour's view" is my extrapolation, so the chapter should not cite it as showing that.
  - Sample sizes were not in the abstract.
  - The PubMed page itself was blocked by a cookie wall.

**L3-4 (H for the abstract, M for the hour figures) friendship hours, ch11.** Hall JA (2019). "How many hours does it take to make a friend?" *Journal of Social and Personal Relationships* 36(4), 1278-1296. DOI 10.1177/0265407518761225. Published online 15 March 2018, in print April 2019.
- **URLs:**
  - Crossref API record with the publisher-deposited abstract (H for the abstract), https://api.crossref.org/works/10.1177/0265407518761225.
  - University of Kansas press release, https://news.ku.edu/news/article/2018/03/06/study-reveals-number-hours-it-takes-make-friend (page date Wed 03/28/2018, although the URL says 03/06). M.
  - Greater Good, UC Berkeley, https://greatergood.berkeley.edu/article/item/how_long_does_it_take_to_make_a_friend (M).
  - The SAGE pages (doi/full, doi/abs, doi/pdf) were all bot_blocked, so I did not read the paper's own text or tables.
- **How it was measured:**
  - Study 1: 355 MTurk adults who had moved in the last six months estimated hours spent with a new acquaintance and rated closeness.
  - Study 2: 112 first-year students reported hours with two new acquaintances, three times over 9 weeks.
  - Both were self-reports. The press release names four stages: acquaintance, casual friend, friend, close friend.
- **Hour estimates (press release):**
  - Lead paragraph: "roughly 50 hours of time together to move from mere acquaintance to casual friend, 90 hours to go from that stage to simple 'friend' status and more than 200 hours before you can consider someone your close friend."
  - Combined-studies sentence: "between 40 and 60 hours to form a casual friendship, 80-100 hours to transition to being a friend and more than 200 hours together to become good friends."
- **Quotes:**
  - Abstract: "friendship status was examined as a function of hours together, shared activities, and everyday talk."
  - Abstract: "Hours together was associated with closer friendships. Time spent engaging in leisure activities also predicted closeness."
  - Press release: "Hours spent working together just don't count as much, Hall's study found."
- **Caveats:**
  - **Conflicting numbers:** Greater Good gives different figures by group. Students took 43 hours (acquaintance to casual friend), then 57 more to "friend", then about 119 for "good or best friends". Adults took 94 hours, then 164, then "an additional 100 hours". The wording is ambiguous on whether these are incremental or cumulative. Use the press-release ranges, hedged as estimates, until someone reads the paper's tables.
  - The hours are self-estimated, and the abstract speaks of association, not a guaranteed threshold.
  - The paper is about friendship, not romantic love, so ch11 should not present it as evidence about romance.
  - Greater Good says hanging out and relaxing, not all activities, were linked to closeness.

**L3-4b (H for the abstract) mere exposure, ch11 optional.** Zajonc RB (1968). "Attitudinal effects of mere exposure." *Journal of Personality and Social Psychology Monograph Supplement* 9(2, Pt. 2), June 1968.
- **DOI:** not verified in this session. A search snippet from SCIRP gives pages 1-27 (not fetched).
- **URL read:** https://web.mit.edu/curhan/www/docs/Articles/biases/9_J_Personality_Social_Psychology_1_(Zajonc).pdf, an MIT-hosted copy of the monograph (title page, abstract and introduction read). The PsycNet record returned only boilerplate, so I treat it as unread.
- **Quotes:**
  - "The hypothesis is offered that mere repeated exposure of the individual to a stimulus object enhances his attitude toward it."
  - "By 'mere' exposure is meant a condition making the stimulus accessible to the individual's perception."
  - The introduction opens with a 1967 Associated Press story about a student who attended a class inside a black bag. It says the class's "attitude changed from hostility toward the Black Bag to curiosity and finally to friendship."
- **Caveats:**
  - The bag story is a news anecdote used as an illustration, not data.
  - The evidence is about attitudes to words, symbols and objects, not close friendships.
  - Mere exposure is not the same as time spent together, and Hall's finding that shared leisure time matters more than hours at work cuts against reading them as one thing.

**Not read:**
- Not read: SAGE pages for Hall 2019, the paper text and tables (bot_blocked on doi/full, doi/abs and doi/pdf).
- Not read: Paul & Moser full text (doi.org redirect hit a Cloudflare "Just a moment" page, ScienceDirect bot_blocked), so only the abstract was read.
- Not read: PubMed record for Galinsky & Moskowitz (cookie wall; Europe PMC abstract used instead), and the paper's full text, so sample sizes were not read.
- Not read: PsycNet Zajonc record (boilerplate only), Zajonc's DOI (not seen), and the Wiley full text of Lally (only the abstract page; full text came from the third-party PDF).
- Not read: ResearchGate, Instagram, Facebook, affina.fr, introvrs.com, lesamis.cc, grass.camp, evidencebasedmentoring.org (search snippets only, not fetched).

## 6. Contradictions inside the guide and safe wording

- Hot Spring: "completely revives" (FAQ) vs "restore some of his strength" (walkthrough). Write "memulihkan tenaga" without "sepenuhnya".
- Greg's Fishing Rod hours: 6-9 a.m. vs 7-10 a.m. Write "pagi hari di musim semi".
- Calf to Cow time and Dog maturity: figures disagree. Do not state them.
- Fish Food price and Grass days: figures disagree. Do not state them.
- Goddess Festival day, Kai's fireworks location, Blue Feather threshold ("red" vs "very close to red"): state no day or exact threshold; write "ketika hatinya hampir atau sudah merah".
- Weather: the guide says "hurricanes" (summer) and "blizzards" or "snowstorms" (winter), never "typhoon". Write "badai" and "badai salju".
- Cliff helps "Duke and Sasha" (2248) vs the winery of Duke and Manna. Write "kebun anggur Aja Winery milik Duke".
- Harvest Sprites: the guide has no "training" action; they improve as they keep working and are paid (L4-4, C-86, C-92). Write "makin terampil seiring bekerja".
- North American release day: 22 vs 30 November 2000. Write "November 2000".
- Wada's role: "produser" plus "pencipta seri" (Gamasutra 2007).

## 7. Chapter map (which items each chapter owns)

| Ch | Title (= SUMMARY entry) | Game items | Lesson items |
|---|---|---|---|
| 01 | Ladang Warisan yang Penuh Batu | A1-1 to A1-17, L4-1a, L4-1b, L4-1c | L1-1a, L1-1b |
| 02 | Stamina Bukan Sumber Daya Tak Terbatas | A2-1 to A2-14 (owner of the fatigue warning stages and the Clinic) | L1-2a, L1-2b, L1-2c |
| 03 | Urutan Kerja yang Menghemat Waktu | A3-1 to A3-14 | L1-3a, L1-3b |
| 04 | Benih yang Sesuai dengan Musimnya | A4-1 to A4-18 | L2-1a, L2-1b |
| 05 | Rezeki Kecil Saat Menunggu Panen | A5-1 to A5-14 | L2-2b, L2-2c |
| 06 | Tiga Hari Tanpa Cangkul | B-1 to B-34 | L2-3a |
| 07 | Ayam Dulu, Sapi Kemudian | B-35 to B-63 | L2-4a, L2-4b, L2-4c |
| 08 | Sapaan dan Sikat Setiap Hari | B-64 to B-94 (owner of storms and animal care) | L3-1 |
| 09 | Festival yang Sayang Dilewatkan | C-1 to C-29 | L3-2, L3-2b |
| 10 | Setiap Orang di Desa Punya Cerita | C-30 to C-64 | L3-3 |
| 11 | Hati yang Berubah Warna Perlahan | C-65 to C-81 | L3-4 (friendship, not romance: say so) |
| 12 | Menyerahkan Pekerjaan kepada Harvest Sprites | C-82 to C-98 | L4-2a, L4-2b |
| 13 | Tambang yang Tidak Bisa Didaki Kembali | B-95 to B-121 (refer to bab 2 for fatigue stages) | L4-3a, L4-3b |
| 14 | Referensi | section 9 | section 9 |

Not used (read but weak or off-topic): L1-1 HBR body (paywalled), L2-2a OJK amount (U), L2-3b training returns (U), L3-3b perspective taking (lab stereotype tasks, not unemployment), L3-4b mere exposure (DOI not verified), Investopedia.

## 8. Identity and copyright guard

- No private source and no personal data: the book needs no identity denylist.
- The guide is copyrighted (Prima Games; game text Natsume and Victor Interactive Software). The book test checks that no chapter shares a run of 12 or more consecutive words with the guide's OCR text (local copy outside the repository, skipped when absent).

## 9. Source table

| ID | Source | URL |
|---|---|---|
| S1 | McBride and Cassady 2000, Prima's Official Strategy Guide (archive.org scan) | https://archive.org/details/docslide.net_harvest-moon-back-to-nature-prima-official-eguidepdf |
| S2 | Wikipedia, Harvest Moon: Back to Nature | https://en.wikipedia.org/wiki/Harvest_Moon:_Back_to_Nature |
| S3 | Marvelous, official Bokujo Monogatari series site, Harvest Moon page | https://www.bokumono.com/sub/harvest.php |
| S4 | Sheffield 2007, Gamasutra interview with Yasuhiro Wada | https://www.gamedeveloper.com/business/harvest-man-yasuhiro-wada-s-gentle-world |
| S5 | Weick 1984, American Psychologist | https://doi.org/10.1037/0003-066X.39.1.40 |
| S6 | Amabile and Kramer 2011, Harvard Business Review | https://hbr.org/2011/05/the-power-of-small-wins |
| S7 | AMA interview with Amabile and Kramer on the progress principle | https://www.amanet.org/articles/the-worth-of-small-wins-teresa-amabile-and-steven-kramer-on-the-progress-principle/ |
| S8 | Watson et al. 2015, Sleep (AASM and SRS consensus) | https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/ |
| S9 | Van Dongen et al. 2003, Sleep | https://doi.org/10.1093/sleep/26.2.117 |
| S10 | Pega et al. 2021, Environment International (WHO/ILO) | https://doi.org/10.1016/j.envint.2021.106595 |
| S11 | WHO news release on long working hours, 17 May 2021 | https://www.who.int/news/item/17-05-2021-long-working-hours-increasing-deaths-from-heart-disease-and-stroke-who-ilo |
| S12 | Rubinstein, Meyer, Evans 2001, JEP: Human Perception and Performance | https://doi.org/10.1037/0096-1523.27.4.763 |
| S13 | American Psychological Association, Multitasking: Switching costs | https://www.apa.org/topics/research/multitasking |
| S14 | Mischel, Shoda, Rodriguez 1989, Science | https://doi.org/10.1126/science.2658056 |
| S15 | Watts, Duncan, Quan 2018, Psychological Science | https://doi.org/10.1177/0956797618761661 |
| S16 | Federal Reserve Board, SHED 2025 press release, 13 May 2026 | https://www.federalreserve.gov/newsevents/pressreleases/other20260513a.htm |
| S17 | DJKN Kemenkeu (KPKNL Lahat), Investasi Bagi Orang Berpenghasilan Tetap | https://www.djkn.kemenkeu.go.id/kpknl-lahat/baca-artikel/18366/Investasi-Bagi-Orang-Berpenghasilan-Tetap.html |
| S18 | Federal Reserve Bank of St. Louis, Real-Life Examples of Opportunity Cost | https://www.stlouisfed.org/open-vault/2020/january/real-life-examples-opportunity-cost |
| S19 | Econlib, Opportunity Cost | https://www.econlib.org/library/Topics/College/opportunitycost.html |
| S20 | Investor.gov (SEC), Diversify Your Investments | https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/diversify-your-investments |
| S21 | OJK siaran pers SP 167/DKPU/OJK/IX/2026 | https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Gelar-LIKE-IT-di-Provinsi-Banten.aspx |
| S22 | Lally et al. 2010, European Journal of Social Psychology | https://doi.org/10.1002/ejsp.674 |
| S23 | Holt-Lunstad, Smith, Layton 2010, PLoS Medicine | https://doi.org/10.1371/journal.pmed.1000316 |
| S24 | Harvard Gazette 2017 on the Harvard Study of Adult Development | https://news.harvard.edu/gazette/story/2017/04/over-nearly-80-years-harvard-study-has-been-showing-how-to-live-a-healthy-and-happy-life/ |
| S25 | Paul and Moser 2009, Journal of Vocational Behavior | https://doi.org/10.1016/j.jvb.2009.01.001 |
| S26 | Hall 2019, Journal of Social and Personal Relationships | https://doi.org/10.1177/0265407518761225 |
| S27 | University of Kansas news release on Hall's study, 2018 | https://news.ku.edu/news/article/2018/03/06/study-reveals-number-hours-it-takes-make-friend |
| S28 | Whillans et al. 2017, PNAS | https://doi.org/10.1073/pnas.1706541114 |
| S29 | Harvard Business School Online, How to Delegate Effectively | https://online.hbs.edu/blog/post/how-to-delegate-effectively |
| S30 | Buehler, Griffin, Ross 1994, JPSP | https://doi.org/10.1037/0022-3514.67.3.366 |
| S31 | Arkes and Blumer 1985, OBHDP | https://doi.org/10.1016/0749-5978(85)90049-4 |

Item to source mapping: L4-1a uses S2, S3; L4-1b uses S4; L4-1c and sets A, B, C use S1; L1-1a S5; L1-1b S6, S7; L1-2a S8; L1-2b S9; L1-2c S10, S11; L1-3a S12; L1-3b S13; L2-1a S14; L2-1b S15; L2-2b S17; L2-2c S16; L2-3a S18, S19; L2-4a S17; L2-4b S21; L2-4c S20; L3-1 S22; L3-2 S23; L3-2b S24; L3-3 S25; L3-4 S26, S27; L4-2a S28; L4-2b S29; L4-3a S30; L4-3b S31.
