var svg = d3.select('svg');
var svgNode = svg.node();

var rect   = svgNode.getBoundingClientRect();
var width  = rect.width;
var height = rect.height;

var tree_width = (width/4) * 3;

var accents = ["#30a2da", "#fc7f0b", "#fc4f30", "#17becf", "#8cc63e", "#9467bd"];
var grey = "#bbbbbb"

console.log(width);


d3.json('tree.json').then(function(dataset) {
    dataset.sort(function(a, b) {
        return a["parent"] <= b["parent"]
    })

    // Calc x's
    dataset.forEach(node => {
        filtered_list = dataset.filter(x => x["level"] === node["level"]);
        level_size = filtered_list.length + 1;
        node["x"] = (filtered_list.indexOf(node) + 1) * (tree_width/level_size);
    });
    console.log(dataset);

    // Calc y's
    var max_level = 0
    dataset.forEach(node => {
        if (node.level > max_level) {
            max_level = node.level
        }
    });
    max_level += 1;


    var linkG = svg.append('g')
        .attr('class', 'links-group');

    var nodeG = svg.append('g')
        .attr('class', 'nodes-group');

    // Add g's for each leaf
    var nodeEnter = nodeG.selectAll('.node')
        .data(dataset)
        .enter()
        .append('g').attr('class', 'node')
        .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + (height/max_level) * d.level + ')';
        }).on("click", function (d) {
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

    // Add pie chart of types to post-expand visualizations
    var type_pie = post_expand.append('g').attr('class', 'sub-chart').attr('transform', 'translate(-180, 0)')
    type_pie.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-after-edge").attr("dy", -70).attr('class', 'sub-chart-title').text("Tumour Types")
    type_pie.append('g').attr('class', 'pie').selectAll('path').data(d => pie(countTypes(d.types)))
        .enter().append('path').attr('d', arc).attr('class', 'pie-slice')
        .attr('fill', p => colorForType(p.data.type));
    type_pie.selectAll('path').append('title').text(p => p.data.type + ": " + p.data.count)

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

                scale = d3.scaleLinear().domain([d.allele_freq.min, d.allele_freq.max]).range([0, 1]);
                [min, max] = scale.domain();
                step = (max - min) / 15;
                hist = d3.histogram().value(e => e).domain(scale.domain()).thresholds(d3.range(min, max, step));

                bins = hist(d.allele_freq[i]);
                bins.forEach(function (e) {
                    max = d3.max(bins, f => f.length);
                    e.size = e.length / max;
                    e.scaled_x0 = scale(e.x0);
                    e.scaled_x1 = scale(e.x1);
                })
                return bins
            })
            .enter()
            .append("rect")
            .attr("x", d => -10 * d.size).attr("width", d => 2 * 10 * d.size).attr("y", d => -120 * d.scaled_x1 + 0)
            .attr("height", d => 120 * (d.scaled_x1 - d.scaled_x0)).attr("fill", accents[i])
            .attr("stroke", accents[i])
            .append('title').text(d => (Math.round(d.x0 * 100) + "%-" + Math.round(d.x1 * 100) + "%: " + d.length));
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

    // Add third visualization
    var third_chart = post_expand.append('g').attr('class', 'sub-chart').attr('transform', 'translate(180, 0)')
    third_chart.append('text').attr('font-size','16px') .attr('font-weight','bold').attr('text-anchor', 'middle')
        .attr("alignment-baseline", "text-after-edge").attr("dy", -70).attr('class', 'chart-title').text("Placeholder")


    // Add branches
    var linkEnter = linkG.selectAll('.link')
        .data(dataset.filter(x => x["level"] > 0))
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 6)
        .attr('y1', function (d) {
            return (height/max_level) * (d.level);
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
                return (height/max_level) * (d.level);
            }
            var par_d = dataset.filter(x => x["id"] === d.parent)[0];
            return (height/max_level) * (par_d.level);
        })
})

function make_big(node, max_level) {
    d = node.datum()
    rect = node.select('rect');
    title = node.select('text');

    console.log(node.select('.g-pre-expand'))
    console.log(node.select('.g-post-expand'))
    node.select('.g-pre-expand').attr("opacity", 0.0);
    node.select('.g-post-expand').transition().attr("opacity", 1.0);

    x = -270
    if (d.x + x <= 0) {
        x = 5 - d.x
    }
    else if (d.x + x + 540 >= tree_width) {
        x = tree_width - 5 - 540 - d.x
    }

    y = -115
    if (((height/max_level) * d.level) + y <= 0) {
        y = 5 - ((height/max_level) * d.level)
    }
    else if (((height/max_level) * d.level) + y + 230 >= height) {
        y = height - 5 - 230 - ((height/max_level) * d.level);
    }

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

    node.select('.g-post-expand').attr('transform', 'translate(100000, 100000)')
    title.transition().attr('dy', -35).attr('font-size', '16px')
}

function countTypes(types) {
    return Array.from(
        d3.rollup(types, v => v.length, t => t),
        ([type, count]) => ({ type, count })
    );
}