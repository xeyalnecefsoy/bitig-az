export function calculatePollPercentages(options: { votesCount: number }[], totalVotes: number) {
  if (totalVotes === 0) return options.map(() => 0);
  
  const percentages = options.map(opt => Math.round((opt.votesCount / totalVotes) * 100));
  
  // Adjust the max percentage to ensure they sum exactly to 100
  const sum = percentages.reduce((acc, curr) => acc + curr, 0);
  if (sum !== 100 && sum > 0) {
    const differences = options.map((opt, i) => ({
      index: i,
      remainder: (opt.votesCount / totalVotes) * 100 - percentages[i]
    })).sort((a, b) => b.remainder - a.remainder);
    
    let diff = 100 - sum;
    for (let i = 0; i < Math.abs(diff); i++) {
        percentages[differences[i % differences.length].index] += diff > 0 ? 1 : -1;
    }
  }
  
  return percentages;
}
