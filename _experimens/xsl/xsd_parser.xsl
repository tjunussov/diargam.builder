<?xml version="1.0" encoding="windows-1251"?>
<xsl:stylesheet version="1.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:wx="http://www.bee.kz/wx" 
	xmlns:xs="http://www.w3.org/2001/XMLSchema">

	<!-- Global Definitions -->
	
	<xsl:output method="html" omit-xml-declaration="yes" encoding="windows-1251" indent="no"/>
	<xsl:strip-space elements="*" />
	
	<xsl:key name="group_set" match="xs:schema/xs:element" use="@wx:group"/>

	<!-- <Root> -->

	<xsl:template match="xs:schema"><style>
			 .wx-bpm-tool-node {
				 display:inline-block; width:20px; height:20px;  border:1px outset; background-color:#f0f0f0; margin-right:5px;
			 }
         </style>
		
	
		
			<!--Schema - <xsl:value-of select="@targetNamespace"/>-->
            <!--div class="tab" style="display:none;">-webkit-user-select:none; -moz-user-select:none;
				<xsl:apply-templates select="xs:element"/>
            </div-->
         <div style="font:11px normal Arial, Helvetica, sans-serif; text-transform:capitalize; color:#aaa; border:1px solid #ccc; margin-right:5px; padding:5px;">
            <xsl:for-each select="xs:element[not(@wx:abstract)]">
                 <div>
                 	<div class="wx-bpm-tool-node" style="background-image: url(node-types/{@name}.png)">
                    	<xsl:attribute name="node-name"><xsl:value-of select="@name"/></xsl:attribute>
                    </div>
                 	<xsl:choose>
                    	<xsl:when test="@wx:title">
		                 	<xsl:value-of select="@wx:title"/>
                        </xsl:when>
                        <xsl:otherwise>
	                        <xsl:value-of select="@name"/>
                        </xsl:otherwise>
                     </xsl:choose>
                 </div>
            </xsl:for-each>
         </div>
         
         
	</xsl:template>
		
</xsl:stylesheet>