function create() {
  // Performs a topological sort on the graph to determine channel order
  function topologicalSort(graph) {
    const visited = new Set();
    const tempMark = new Set(); // For cycle detection
    const order = [];

    function dfs(node) {
      if (tempMark.has(node))
        throw new Error("Cycle detected in priority graph");
      if (visited.has(node)) return;
      tempMark.add(node);
      if (graph[node]) {
        for (const neighbor of graph[node]) {
          dfs(neighbor);
        }
      }
      tempMark.delete(node);
      visited.add(node);
      order.push(node);
    }

    for (const node in graph) {
      dfs(node);
    }
    return order.reverse();
  }

  // Mixes chunks from different channels based on ratios for middle priority
  function mixMiddlePriority(chunks, channel_index) {
    if (chunks.length <= 1) return chunks;
    // Collect chunks by channel
    const byChannel = {};
    for (const chunk of chunks) {
      const channel = chunk.hoisted.group.AND[0][0];
      if (!byChannel[channel]) byChannel[channel] = [];
      byChannel[channel].push(chunk);
    }
    const channels = Object.keys(byChannel);
    if (channels.length <= 1) return chunks;

    // Compute average channel ratios
    const globalRatios = {};
    for (const channel of channels) {
      const ratios = byChannel[channel].map(
        (c) => c.CHUNK_RATIO || { x: 1, y: 0 }
      );
      const avgX =
        ratios.reduce((sum, r) => sum + (r.x || 1), 0) / ratios.length;
      const avgY =
        ratios.reduce((sum, r) => sum + (r.y || 0), 0) / ratios.length;
      globalRatios[channel] = { x: avgX, y: avgY };
    }

    // Calculate probabilities and interleave
    const result = [];
    const queues = channels.map((ch) => ({
      channel: ch,
      chunks: [...byChannel[ch]],
    }));
    while (queues.some((q) => q.chunks.length > 0)) {
      let totalWeight = 0;
      const weights = queues.map((q) => {
        if (q.chunks.length === 0) return 0;
        const chunk = q.chunks[0];
        const gr = globalRatios[q.channel];
        const weight = (chunk.CHUNK_RATIO?.y || 0) * gr.y + gr.x;
        totalWeight += weight;
        return weight;
      });
      if (totalWeight === 0) break; // Avoid infinite loop
      const rand = Math.random() * totalWeight;
      let cumulative = 0;
      for (let i = 0; i < queues.length; i++) {
        if (weights[i] === 0) continue;
        cumulative += weights[i];
        if (rand <= cumulative) {
          const chunk = queues[i].chunks.shift();
          result.push(chunk);
          break;
        }
      }
    }
    return result;
  }

  function reIndex(pt) {
    // Collect all unique channels
    const channels = new Set();
    for (const chunk of pt) {
      if (chunk.hoisted && chunk.hoisted.hoist) {
        const channel = chunk.hoisted.group.AND[0][0];
        channels.add(channel);
      }
    }

    // Build priority graph
    const graph = {};
    const middlePriorityRelations = new Set();
    for (const channel of channels) {
      graph[channel] = new Set();
    }
    for (const chunk of pt) {
      if (chunk.hoisted && chunk.hoisted.hoist) {
        const channel = chunk.hoisted.group.AND[0][0];
        if (chunk.hoisted.lowerPriority?.AND) {
          for (const lp of chunk.hoisted.lowerPriority.AND) {
            graph[channel].add(lp[0]);
          }
        }
        if (chunk.hoisted.upperPriority?.AND) {
          for (const up of chunk.hoisted.upperPriority.AND) {
            const upChannel = up[0];
            if (!graph[upChannel]) graph[upChannel] = new Set();
            graph[upChannel].add(channel);
          }
        }
        if (chunk.hoisted.middlePriority?.AND) {
          for (const mp of chunk.hoisted.middlePriority.AND) {
            const mpChannel = mp[0];
            middlePriorityRelations.add(
              JSON.stringify([channel, mpChannel].sort())
            );
          }
        }
      }
    }

    // Topological sort for strict priorities
    const channelOrder = topologicalSort(graph);
    const channelIndex = {};
    channelOrder.forEach((channel, index) => {
      channelIndex[channel] = index;
    });

    // Separate chunks
    const nonHoisted = pt.filter(
      (chunk) => !(chunk.hoisted && chunk.hoisted.hoist)
    );
    const hoisted = pt.filter((chunk) => chunk.hoisted && chunk.hoisted.hoist);

    // Compute line counts for non-hoisted chunks
    const lineCounts = nonHoisted.map(
      (chunk) => chunk.value.split("\n").length
    );

    // Map target line to insertion point
    function getInsertionPoint(targetLine, lineCounts) {
      let cumulative = 0;
      for (let i = 0; i < lineCounts.length; i++) {
        cumulative += lineCounts[i];
        if (targetLine <= cumulative) return i;
      }
      return lineCounts.length;
    }

    // Group hoisted chunks by insertion point and target line for collision handling
    const hoistedGroups = {};
    for (const chunk of hoisted) {
      const ip = getInsertionPoint(chunk.hoisted.target.line, lineCounts);
      if (!hoistedGroups[ip]) hoistedGroups[ip] = {};
      const targetLine = chunk.hoisted.target.line;
      if (!hoistedGroups[ip][targetLine]) hoistedGroups[ip][targetLine] = [];
      hoistedGroups[ip][targetLine].push(chunk);
    }

    // Process each insertion point
    for (const ip in hoistedGroups) {
      const targetGroups = hoistedGroups[ip];
      const allChunksAtIp = [];
      for (const targetLine in targetGroups) {
        let chunks = targetGroups[targetLine];
        // Check for middle priority relations within this target line
        const channelsHere = new Set(
          chunks.map((c) => c.hoisted.group.AND[0][0])
        );
        let hasMiddle = false;
        for (const [ch1, ch2] of middlePriorityRelations) {
          const [c1, c2] = JSON.parse(ch1).sort();
          if (channelsHere.has(c1) && channelsHere.has(c2)) {
            hasMiddle = true;
            break;
          }
        }
        if (hasMiddle) {
          chunks = mixMiddlePriority(chunks, channelIndex);
        } else {
          chunks.sort((a, b) => {
            const ca = a.hoisted.group.AND[0][0];
            const cb = b.hoisted.group.AND[0][0];
            return channelIndex[ca] - channelIndex[cb];
          });
        }
        allChunksAtIp.push(...chunks);
      }
      hoistedGroups[ip] = allChunksAtIp;
    }

    // Build final sequence
    const finalChunks = [];
    for (let i = 0; i < nonHoisted.length; i++) {
      if (hoistedGroups[i]) {
        finalChunks.push(...hoistedGroups[i]);
      }
      finalChunks.push(nonHoisted[i]);
    }
    if (hoistedGroups[nonHoisted.length]) {
      finalChunks.push(...hoistedGroups[nonHoisted.length]);
    }
    return finalChunks;
    // // Generate final lines with metadata
    // const finalLines = [];
    // for (const chunk of finalChunks) {
    //   const lines = chunk.value.split("\n");
    //   lines.forEach((line, idx) => {
    //     finalLines.push({
    //       content: line,
    //       metadata: {
    //         type: chunk.type,
    //         channel: chunk.hoisted?.group?.AND?.[0]?.[0] || null,
    //         targetLine: chunk.hoisted?.target?.line,
    //         originalChunk: chunk,
    //       },
    //     });
    //   });
    // }
    // // return finalLines;
    // // lns as strs
    // return finalLines.map((line) => line.content);
  }
  let GLOBAL_STORAGE = {
    SubHeader: {
      counter: -1,
    },
  };
  function addCommentsToStatment(statment = {}) {
    // console.log(statment.statement.type);
    let type, prams;
    if (statment.statement && statment.statement.prams) {
      type = statment.statement.type;
      prams = statment.statement.prams;
    } else if (statment.type && statment.prams) {
      type = statment.type;
      prams = statment.prams;
    } else {
      console.log("unknown statment", statment);
      return [
        "//AUTO_COMMENTED_ERR note that error while auto commenting this statment as statment structure not compatible",
      ];
    }
    switch (type) {
      case "IMPORT":
        return [`//here we import (hoisted type) from ${prams.path}`];
        break;
      case "ADD_IMPORT":
        return [`//here we import (exact line paste type) from ${prams.path}`];
        break;
      case "JS_BLOCK":
        return [`// an embeeded js code ${/*prams.code*/ ""}`];
        break;
      case "PROP_DEF":
        return [
          `// we have ${prams.name} prop defined here ${prams.abstracts ? `abstracting / extends ${(Array.isArray(optionOtherPROP) ? optionOtherPROP : [optionOtherPROP]).join(" ")}` : ""}`,
        ];
        break;
      case "ACTION_DEF":
        return [
          `// it will call all props to perform actions it includes ${(() => {
            let str = "";
            for (let i = 0; i < prams.parts.length; i++) {
              let prop = parts.propName;
              let action = parts.methodName;
              str += `${action} from ${prop}`;
              if (i % 5 == 0 && i !== prams.parts.length - 2) {
                str += "\n //";
              }
            }
          })()}  with the name (fn name) of ${prams.name}`,
        ];
        break;
      case "PROP_USE":
        return [
          `// using the ${prams.name} prop ${Boolean(prams.as) ? `as ${prams.as} name` : ""}`,
        ];
        break;
      case "ACTION_USE":
        return [`// using the ${prams.actionName} action`];
        break;
      case "GREDIENT_MAP":
        return ["// setting a default gredient map"];
        break;
      case "BGCOLOR":
        return [`// setting a default bg color ${prams.value}`];
        break;
      case "comment":
        return [`// ${prams.value}`];
        break;

      case "Header":
        return [
          `// The ${prams.gate} of the ${prams.type} with ${prams.ast.VALUE.USED}`,
        ];
        break;
      case "SubHeader":
        // todo
        GLOBAL_STORAGE.SubHeader.counter++;
        // console.log(
        //   GLOBAL_STORAGE.SubHeader.counter,
        //   prams.ast["SUB-HEADER"][GLOBAL_STORAGE.SubHeader.counter]
        // );
        let nextUsed = (
          prams.ast["SUB-HEADER"][GLOBAL_STORAGE.SubHeader.counter + 1] || {}
        ).USED;
        if (nextUsed) {
          GLOBAL_STORAGE.SubHeader.counter++;
        } else {
          nextUsed = (
            prams.ast["SUB-HEADER"][GLOBAL_STORAGE.SubHeader.counter] || {}
          ).USED;
        }
        return [`// The ${prams.gate} of the ${prams.type} with ${prams.ast}`];
        break;
      default:
        console.warn(
          "// unknown statment at auto commenting system , post semantic analyzer",
          statment,
          type
        );
        return [
          "//AUTO_COMMENTED_ERR note that error while auto commenting this statment",
        ];
        break;
    }
  }

  function addCommentsToStatments(PT) {
    for (let i = 0; i < PT.length; i++) {
      PT[i].comments = addCommentsToStatment(PT[i]);
    }
    return PT;
  }

  function analyze(partialTranspiled, ast, options = {}) {
    // console.log(partialTranspiled);
    let reIndexed = reIndex(partialTranspiled);
    let commented = options.addComments
      ? addCommentsToStatments(reIndexed)
      : reIndexed;
    let r = commented;
    // console.log(options.addComments);
    // return JSON.stringify(r, null, 2);
    return r;
  }

  return {
    analyze,
  };
}

module.exports = { create };
