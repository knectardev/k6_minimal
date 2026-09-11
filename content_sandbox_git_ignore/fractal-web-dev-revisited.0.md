# Does Web Development Exhibit Fractal Nature? (2013, Revisited)

In 2013 I wrote a piece for Knectar's Labs section asking whether web development — its hierarchies, its documentation, its scaling architectures — has an underlying fractal geometry. Twelve years and a lot of shipped projects later, I want to revisit the question, mostly to correct my younger self.

The original essay made a mistake common to a lot of "X is like a fractal" thinking: it treated *self-similarity* and *fractal geometry* as interchangeable. They aren't. Nested folders look like nested folders at every scale, sure — but that's just what a hierarchy is, by definition. Calling it fractal doesn't add information; it just renames the observation. A real fractal claim requires something stronger: a property that scales *consistently and non-trivially* across orders of magnitude, in a way you could actually measure and falsify. My 2013 self gestured at this ("what fractal dimensions are at play?") without ever proposing a test where the answer could come back "no."

So here's the revisited version of the question, tightened into something falsifiable.

## The bad claim vs. the testable one

**Bad claim (2013 me):** "Software hierarchies are fractal because they're nested at multiple levels."
This is true but empty — it's true of literally every hierarchy that has ever existed, including a company org chart or a Russian nesting doll. No dimension to measure, no way to be wrong.

**Testable claim (2025 me):** Something like — *the structural complexity of a project's documentation and dependency graph follows a consistent scaling relationship (a power law, or a stable fractal dimension via box-counting) across the lifespan of the project, independent of project size.*

That's falsifiable. It might be true. It might not be. That's the whole point — a claim that can't lose isn't a claim, it's a mood.

## What's actually different now

The 2013 essay's proposed methodology was "brute force image processing" — literally screenshotting Photoshop comps and measuring visual granularity by hand. That was the best available tool at the time, but it was always going to be too coarse to detect anything real.

What's changed isn't the theory — it's that the data now exists in structured, queryable form:

- **Git history** gives you a timestamped, weighted graph of every change to a codebase — commit size, file touch frequency, branching and merge patterns. This is a much better candidate for fractal analysis than a folder tree, because commit clustering over time is a genuine complex-systems phenomenon (it plausibly follows power-law or self-affine statistics, the way earthquake magnitudes or river discharge do).
- **Ticket/issue graphs** (dependencies, blocks, sub-tasks) are directed graphs with real topology you can box-count.
- **Design file version histories** (Figma, etc.) expose structural diffs programmatically instead of requiring visual inspection.
- Embedding-based similarity between successive versions of a document gives you an actual quantitative stand-in for what 2013-me vaguely called documentation "texture" — instead of eyeballing indentation depth, you can measure semantic drift between revisions directly.

None of this makes the fractal hypothesis *true*. It just means it's finally checkable instead of merely evocative.

## What I'd actually propose testing

If I were doing this for real, rather than as a blog think-piece, I'd pick one narrow, well-defined thing and try to break it:

1. **Hypothesis:** Commit frequency and commit size on a project follow a scale-invariant (power-law or Hurst-exponent-stable) distribution, similar to other complex human/natural systems — rather than a distribution that changes character as the project scales up.
2. **Data:** Git history from a handful of past Knectar projects of varying size, pulled via the GitHub API.
3. **Method:** Compute a Hurst exponent on commit-frequency time series, or box-count the file-dependency graph at different resolutions, and check whether the resulting dimension is stable across projects of different sizes.
4. **Falsification condition, stated in advance:** If the computed dimension varies wildly and unsystematically between a 2-week project and a 6-month one, the fractal framing is wrong (or at least not doing useful work), and I should say so.

That last part is the piece the original essay was missing entirely. It was constructed so that *any* observation could be read as confirming the premise — more hierarchy, more nesting, more cross-referencing were all just "more fractal." A hypothesis that can absorb every possible result isn't a hypothesis. It's a lens you've already decided to like.

## The honest updated answer

Does web development exhibit fractal nature? I don't actually know — and neither did I in 2013, though I wrote 1,500 words that sounded like I might. What I can say with more confidence now is what it would take to find out: pick a structural property that isn't fractal *by definition*, pull the real data (which is finally sitting in accessible APIs instead of locked in screenshots), compute an actual dimension, and be willing to publish "no, it isn't" as an answer.

Whether or not the math comes back interesting, that's a better way to have asked the question the first time.
