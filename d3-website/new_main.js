var svg = d3.select('svg');
var svgNode = svg.node();

var y_offset = 120;
var rect   = svgNode.getBoundingClientRect();
var width  = rect.width;
var height = rect.height - y_offset;

var tree_width = (width/5) * 3;

var accents = ["#30a2da", "#fc7f0b", "#fc4f30", "#17becf", "#8cc63e", "#9467bd"];
var grey = "#bbbbbb";
var tooltip_grey = "#dddddd";

var click_time = 0;
var click_wait = 1000;

var desired_vert_space = 0.025;
var scale = 1.0
var tree_score = 36.22067745181044


// Add main plot title, subtitle, and tree-score
svg.append('text')
    .attr('x', 20)
    .attr('y', 80)
    .attr('text-anchor', 'start')
    .attr('font-size', '64px')
    .attr('font-weight', 'bold')
    .attr('class', 'node-title')
    .text('Patient 150');

svg.append('text')
    .attr('x', 20)
    .attr('y', 110)
    .attr('text-anchor', 'start')
    .attr('font-size', '24px')
    .attr('class', 'node-title')
    .text('Head and neck tumor phylogeny');

svg.append('text')
    .attr('x', 20)
    .attr('y', 140)
    .attr('text-anchor', 'start')
    .attr('font-size', '18px')
    .attr('class', 'node-title score-label')
    .style('cursor', 'help')
    .text('Tree score: ' + (Math.round(tree_score * 100) / 100))
    .append('title')
    .text('Represents negative log likelihood of tree portraying the data, the smaller value the better.');




// Load tree.json and build chromosome annotations from mutation_names
d3.json('tree.json').then(function(dataset) {
    // Build chromosome annotations with geneId only
    dataset.forEach(d => {
      d.chromosome_annotations = d.mutation_names.map((m, i) => {
        const chrom = m.split(':')[0].replace(/^chr/, '');
        // Pull the actual gene name from d.geneId
        const geneId = (d.geneId && d.geneId[i]) ? d.geneId[i] : null;
        return { chrom: chrom, geneId: geneId };
      });
    });

    // Calc x's
    dataset.forEach(node => {
        filtered_list = dataset.filter(x => x["level"] === node["level"]);
        level_size = filtered_list.length + 1;
        node["x"] = (filtered_list.indexOf(node) + 1) * (tree_width/level_size);
    });

    // Calc y's
    all_levels = []
    var max_level = 0
    dataset.forEach(node => {
        if (node.level > max_level) {
            max_level = node.level
        }
        all_levels.push(node.level)
    });
    max_level += 1;

    // Calc scale factor
    while (height/max_level < scale * 90 * (desired_vert_space * 2 + 1)) {
        scale *= 0.99;
    }
    console.log(scale);

    //Anna: initialize circle locations
    freqs = []
    names = []
    dataset.forEach(function(cluster){
        freqs.push(cluster.avg_obs_freq)
        names.push(cluster.cluster)
    })
    y_levels = []
    all_levels.forEach(l => {
        y_levels.push(((height/max_level) * l) + y_offset)
    });
    var x_pos = [];
    var start = tree_width; // * .8; //need a better x pos
    for (let i = 0; i < dataset[0].avg_obs_freq.length; i++){
        x_pos.push(start)
        start = start + 150;
    }
    console.log(x_pos)
    createLegend(x_pos, height*0.5); //create the background legend
    createBalls(freqs, x_pos, y_levels, names, max_level);

    //Anna: Done

    //console.log(dataset);
    var mainG = svg.append('g').attr('class', 'tree')
        .attr('transform', 'translate(0, ' + y_offset + ')');

    var linkG = mainG.append('g')
        .attr('class', 'links-group');

    var nodeG = mainG.append('g')
        .attr('class', 'nodes-group');

    // Add g's for each leaf
    var nodeEnter = nodeG.selectAll('.node')
        .data(dataset)
        .enter()
        .append('g').attr('class', 'node')
        .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + ((height/max_level) * d.level) + ') scale(' + scale + ')';
        }).on("click", function handleClick(d, i) {
            if (Date.now() - click_time < click_wait) {
                return;
            } else {
                click_time = Date.now();
            }

            _ = transitionCircles(i.level-1, i.id-1) //Anna: added to move the circles
            var clicked_node = this
            clicked_node.parentNode.appendChild(clicked_node);
            rect = d3.select(clicked_node).select('rect');

            if (rect.attr("width") < 225) {
                nodeG.selectAll('.node').each(function(d) {
                    if (this === clicked_node) {
                        return;
                    }
                    make_small(d3.select(this), max_level);
                });
                make_big(d3.select(this), max_level);
            }
            else {
                make_small(d3.select(this), max_level);
            }
        });

    // Add rects for each g for each leaf
    nodeEnter.append('rect')
        .attr('class', 'node-box')
        .attr('y', function (d) {
            return -45;
        })
        .attr("x", function (d) {
            return -110;
        })
        .attr("width", 220).attr("height", 90)
        .attr("fill", "white").attr("rx", 5)

    // Add title text to each g
    nodeEnter.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-before-edge").attr("dy", -35).attr('class', 'node-title').text(function (d) {
        return (
            "Cluster " + d.cluster + " (" + d.mutations + " Mutations)"
        );
    });

    // Setup gs to hold pre and post expanded visualizations
    var pre_expand = nodeEnter.append('g').attr("class", "g-pre-expand")
    var post_expand = nodeEnter.append('g').attr("class", "g-post-expand").attr("opacity", 0.0).attr('transform', 'translate(100000, 100000)')

    // Add bar chart of probs to pre expand visualization
    var prob_bars = pre_expand.append('g').attr('class', 'sub-chart').attr('transform', 'translate(-90, 40)').attr('fill', '#bbbbbb').attr('stroke', 'black');
    prob_bars.append('text').attr('font-size','14px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr('dy', '-35').attr('dx', '90').attr('stroke', 'None')
        .attr("alignment-baseline", "text-after-edge").attr('class', 'sub-chart-title').text("Observed Frequency");
    for (let i = 0; i < 4; i++) {
        prob_bars.append('rect').attr('class', 'bar').attr("x", [4, 48, 92, 136][i]).attr("width", 40)
            .attr('height', d => 35 * d.avg_obs_freq[i]).attr('y', d => -35 * d.avg_obs_freq[i]).attr("fill", accents[i])
            .on('mouseover', function (event, d) {
                show_tooltip("T" + i + ": " + Math.round(d.avg_obs_freq[i] * 100) + "%", event.target, [4, 48, 92, 136][i] + 20, -15, scale);
            }).on('mouseout', hide_tooltip);
    }
    prob_bars.append('line').attr("x1", 0).attr("x2", 180).attr("y1", -35).attr("y2", -35).attr('stroke-width', 2);
    prob_bars.append('line').attr("x1", 0).attr("x2", 180).attr("y1", -17.5).attr("y2", -17.5).attr('stroke-width', 1);
    prob_bars.append('line').attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", -35).attr('stroke-width', 2);
    prob_bars.append('line').attr("x1", 0).attr("x2", 180).attr("y1", 0).attr("y2", 0).attr('stroke-width', 2);
    prob_bars.append('line').attr("x1", 180).attr("x2", 180).attr("y1", 0).attr("y2", -35).attr('stroke-width', 2);

    // Pie chart setup functions
    pie = d3.pie().value(d => d.count).sort(null);
    arc = d3.arc().innerRadius(0).outerRadius(65);

    function colorForType(type) {
        accents_scale = d3.scaleOrdinal(accents);
        return type.startsWith("no known") ? grey : accents_scale(type);
    }

    console.log(dataset);
    // Add pie chart of types to post-expand visualizations
    var type_pie = post_expand.append('g').attr('class', 'sub-chart').attr('transform', 'translate(-180, 0)')
    type_pie.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-after-edge").attr("dy", -70).attr('class', 'sub-chart-title').text("Tumour Types")
    type_pie.append('g').attr('class', 'pie').selectAll('path').data(d => pie(countTypes([d.types, d.roles, d.gene_ids])))
        .enter().append('path').attr('d', arc).attr('class', 'pie-slice')
        .attr('fill', p => colorForType(p.data.type));
    type_pie.selectAll('path')
        .on('mouseover', function (event, d) {
            console.log(d)
            show_tooltip("Type: " + d.data.type + ": " + d.data.count, event.target, 0, -45, scale);
        }).on('mouseout', hide_tooltip);

    // Add quality chart
    var quality_chart = post_expand.append('g').attr('class', 'sub-chart')
    quality_chart.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-after-edge").attr("dy", -70).attr('class', 'sub-chart-title').text("Allele Mut. Frequencies")

    var hists = quality_chart.append('g').attr('transform', 'translate(5, 55)')

    for (let i = 0; i < 4; i++) {
        hists.append('line').attr("x1", -45 + (30 * i)).attr("y1", -120).attr("x2", -45 + (30 * i)).attr("y2", 0).attr('stroke-width', 1).attr('stroke', 'black');
        hists.append('text').attr('font-size','12px') .attr('font-weight','bold').attr('text-anchor', 'middle').attr('dx', -45 + (30 * i)).attr('dy', 2)
            .attr("alignment-baseline", "text-before-edge").attr('class', 'sub-chart-label').text(function (d) {
                return "T" + i;
            });

        hists.append('g').attr('transform', 'translate(' + (-45 + (30 * i)) + ', 0)').selectAll("rect")
            .data(function (d) {
                freqs = d.allele_freq
                freqs.forEach(function (e) {
                    e.max = d3.max(e)
                    e.min = d3.min(e)
                })
                d.allele_freq.max = d3.max(freqs, e => e.max);
                d.allele_freq.min = d3.min(freqs, e => e.min);

                allele_scale = d3.scaleLinear().domain([d.allele_freq.min, d.allele_freq.max]).range([0, 1]);
                [min, max] = allele_scale.domain();
                step = (max - min) / 15;
                hist = d3.histogram().value(e => e).domain(allele_scale.domain()).thresholds(d3.range(min, max, step));

                bins = hist(d.allele_freq[i]);
                bins.forEach(function (e) {
                    max = d3.max(bins, f => f.length);
                    e.size = e.length / max;
                    e.scaled_x0 = allele_scale(e.x0);
                    e.scaled_x1 = allele_scale(e.x1);
                })
                return bins
            })
            .enter()
            .append("rect")
            .attr("x", d => -10 * d.size).attr("width", d => 2 * 10 * d.size).attr("y", d => -120 * d.scaled_x1 + 0)
            .attr("height", d => 120 * (d.scaled_x1 - d.scaled_x0)).attr("fill", accents[i])
            .attr("stroke", accents[i])
            .on('mouseover', function (event, d) {
                show_tooltip(Math.round(d.x0 * 100) + "%-" + Math.round(d.x1 * 100) + "%: " + d.length, event.target, 0, -120 * d.scaled_x1 + 20, scale);
            }).on('mouseout', hide_tooltip);
    }
    hists.append('line').attr("x1", -60).attr("y1", 1).attr("x2", 60).attr("y2", 1).attr('stroke-width', 2).attr('stroke', 'black');
    hists.append('line').attr("x1", -60).attr("y1", -121).attr("x2", -60).attr("y2", 1).attr('stroke-width', 2).attr('stroke', 'black');
    hists.append('line').attr("x1", 60).attr("y1", -121).attr("x2", 60).attr("y2", 1).attr('stroke-width', 2).attr('stroke', 'black');
    hists.append('line').attr("x1", -60).attr("y1", -121).attr("x2", 60).attr("y2", -121).attr('stroke-width', 2).attr('stroke', 'black');
    hists.append('text').attr('font-size','12px') .attr('font-weight','bold').attr('text-anchor', 'end').attr('dx', -62).attr('dy', -120)
        .attr("alignment-baseline", "text-before-edge").attr('class', 'sub-chart-label').text(function (d) {
            return Math.round(d.allele_freq.max * 100) + "%";
        });
    hists.append('text').attr('font-size','12px') .attr('font-weight','bold').attr('text-anchor', 'end').attr('dx', -62)
        .attr("alignment-baseline", "text-after-edge").attr('class', 'sub-chart-label').text(function (d) {
            return Math.round(d.allele_freq.min * 100) + "%";
        });

    // Add chromosome distribution histogram
    post_expand.each(function(d) {
      console.log("Chromosome histogram init for cluster", d.cluster, "with annotations:", d.chromosome_annotations);
      var chart = d3.select(this).append('g')
          .attr('class', 'sub-chart')
          .attr('transform', 'translate(100, 0)');

      chart.append('text')
          .attr('font-size', '16px')
          .attr('font-weight', 'bold')
          .attr('text-anchor', 'middle')
          .attr('x', 75)
          .attr('alignment-baseline', 'text-after-edge')
          .attr('dy', -70)
          .text('Chr. Distribution');

      // Group for axes and bars, moved down to align with other charts
      var histGroup = chart.append('g')
          .attr('transform', 'translate(0,55)');

      histGroup.append('line')
          .attr('x1', 0).attr('y1', 0)
          .attr('x2', 0).attr('y2', -100)
          .attr('stroke-width', 2).attr('stroke', 'black');
      histGroup.append('line')
          .attr('x1', 0).attr('y1', 0)
          .attr('x2', 150).attr('y2', 0)
          .attr('stroke-width', 2).attr('stroke', 'black');

      var ann = d.chromosome_annotations || [];
      console.log("Annotations array:", ann);
      var counts = Array.from(
          d3.rollup(ann, v => v.length, a => a.chrom),
          ([chrom, count]) => ({chrom, count, annotations: ann})
      );
      // Sort chromosomes numerically ascending
      counts.sort((a, b) => {
          var aN = isNaN(+a.chrom) ? a.chrom : +a.chrom;
          var bN = isNaN(+b.chrom) ? b.chrom : +b.chrom;
          return aN - bN;
      });
      var topChroms = counts;
      console.log("All chromosomes for cluster", d.cluster, ":", topChroms.map(c => c.chrom), "counts:", topChroms.map(c => c.count));

      var xScale = d3.scaleBand()
          .domain(topChroms.map(c => c.chrom))
          .range([0, 150])
          .padding(0.1);
      var yScale = d3.scaleLinear()
          .domain([0, d3.max(topChroms, c => c.count)])
          .range([0, 100]);

      // Color scale for chromosomes
      var chromColor = d3.scaleOrdinal(accents).domain(topChroms.map(c => c.chrom));

      histGroup.selectAll('.chrom-bar')
          .data(topChroms)
          .enter().append('rect')
          .attr('class', 'chrom-bar')
          .attr('x', c => xScale(c.chrom))
          .attr('y', c => -yScale(c.count))
          .attr('width', xScale.bandwidth())
          .attr('height', c => yScale(c.count))
          .attr('fill', c => chromColor(c.chrom))
          .attr('stroke', c =>
              c.annotations.some(a => a.chrom === c.chrom && a.geneId && a.geneId !== "no gene")
                  ? 'black' : 'none'
          )
          .attr('stroke-width', c =>
              c.annotations.some(a => a.chrom === c.chrom && a.geneId && a.geneId !== "no gene")
                  ? 2 : 0
          )
          .on('mouseover', function(event, c) {
              // Debug logs for geneId grouping
              // List unique gene IDs on this chromosome, excluding "no gene"
              var genes = Array.from(new Set(
                  c.annotations
                    .filter(a => a.chrom === c.chrom && a.geneId && a.geneId !== "no gene")
                    .map(a => a.geneId)
              )).join(', ');
              show_tooltip(
                  `Chr ${c.chrom}: ${c.count}` + (genes ? ` (${genes})` : ''),
                  event.target, xScale(c.chrom) + (xScale.bandwidth()/2), -10, scale
              );
          })
          .on('mouseout', hide_tooltip);

      histGroup.selectAll('.chrom-label')
          .data(topChroms.filter((c, i) => i % 5 === 0))
          .enter().append('text')
          .attr('class', 'chrom-label')
          .attr('x', c => xScale(c.chrom) + xScale.bandwidth() / 2)
          .attr('y', 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .text(c => c.chrom);
    });

    // Add branches
    var linkEnter = linkG.selectAll('.link')
        .data(dataset.filter(x => x["level"] > 0))
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 6)
        .attr('y1', function (d) {
            return (height/max_level) * d.level;
        })
        .attr('x1', function (d) {
            return d.x;
        })
        .attr('x2', function(d) {
            if (d.parent === null) {
                return d.x;
            }
            var par_d = dataset.filter(x => x["id"] === d.parent)[0]
            return par_d.x;
        })
        .attr('y2', function(d) {
            if (d.parent === null) {
                return (height/max_level) * d.level;
            }
            var par_d = dataset.filter(x => x["id"] === d.parent)[0];
            return (height/max_level) * par_d.level;
        })
});

function make_big(node, max_level) {
    d = node.datum()
    rect = node.select('rect');
    title = node.select('text');

    // console.log(node.select('.g-pre-expand'))
    // console.log(node.select('.g-post-expand'))
    node.select('.g-pre-expand').attr("opacity", 0.0);
    node.select('.g-post-expand').transition().attr("opacity", 1.0);

    x = -270
    if (d.x + x <= 0) {
        console.log("Touch wrong x");
        x = 5 - d.x
    }
    else if (d.x + x + 540 >= tree_width) {
        console.log("Touch x");
        x = tree_width - 5 - 540 - d.x
    }

    y = -115
    if (((height/max_level) * d.level) + y <= 0) {
        y = 5 - ((height/max_level) * d.level)
    }
    else if (((height/max_level) * d.level) + y + 230 >= height) {
        y = height - 5 - 230 - ((height/max_level) * d.level);
    }

    node.select('.g-pre-expand').attr('transform', 'translate(100000, 100000)')
    node.select('.g-post-expand').attr('transform', 'translate(' + (270 + x) + ', ' + (115 + y + 35) + ')')
    rect.transition().attr('y', y).attr("x", x).attr("width", 540).attr("height", 230)
    title.transition().attr('dy', y + 5).attr('font-size', '32px')
}

function make_small(node, max_level) {
    d = node.datum()
    rect = node.select('rect');
    title = node.select('text');

    node.select('.g-pre-expand').transition().attr("opacity", 1.0);
    node.select('.g-post-expand').attr("opacity", 0.0);

    rect.transition().attr('y', function (d) {
        return -45;
    })
    .attr("x", function (d) {
        return -110;
    })
    .attr("width", 220).attr("height", 90)

    node.select('.g-pre-expand').attr('transform', 'translate(0, 0)')
    node.select('.g-post-expand').attr('transform', 'translate(100000, 100000)')
    title.transition().attr('dy', -35).attr('font-size', '16px')
}

function show_tooltip(text, target, x, y, scale) {
    target = target.getScreenCTM();
    width = 7 * text.length;

    tool_tip = svg.append('g').attr('class', 'tool-tip').attr('transform', 'translate(' + (target.e + (x * scale)) + ', ' + (target.f + (y * scale)) + ')');
    tool_tip.append('rect').attr("x", -width/2).attr("width", width).attr("y", -50)
        .attr("height", 25).attr("fill", tooltip_grey).attr('stroke-width', 3);
    tool_tip.append('text').attr('font-size','12px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "middle").attr("dy", -37.5).attr("dx", 0).text(text)
}

function hide_tooltip() {
    d3.selectAll('.tool-tip').remove();
}

function countTypes(data) {
    arr1 = data[0];
    arr2 = data[1];
    arr3 = data[2];
    combined = arr1.map((item, index) => `${item}; Role: ${arr2[index]}; Gene Id: ${arr3[index]}`);
    console.log(Array.from(
        d3.rollup(combined, v => v.length, t => t),
        ([type, count]) => ({ type, count })
    ));
    return Array.from(
        d3.rollup(combined, v => v.length, t => t),
        ([type, count]) => ({ type, count })
    );
}